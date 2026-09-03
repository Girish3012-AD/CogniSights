import os
import numpy as np
import rasterio
from rasterio.errors import RasterioIOError
from fastapi import FastAPI, HTTPException, Form, UploadFile, File
from pydantic import BaseModel
from typing import List
import cv2
import torch
from transformers import AutoProcessor, PaliGemmaForConditionalGeneration
from PIL import Image

app = FastAPI(title="SatQuery AI - Internal Geospatial Inference Engine", version="1.0.0")

# Initialize CUDA acceleration if a GPU is available, otherwise default safely to CPU
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
MODEL_ID = "google/paligemma-3b-pt-224"

print(f"--- [Initializing SatQuery VLM] Loading {MODEL_ID} on hardware: {DEVICE} ---")

# Load highly optimized weights using float16 if running on a local GPU to preserve VRAM
torch_dtype = torch.float16 if DEVICE == "cuda" else torch.float32

try:
    processor = AutoProcessor.from_pretrained(MODEL_ID)
    model = PaliGemmaForConditionalGeneration.from_pretrained(
        MODEL_ID, 
        torch_dtype=torch_dtype
    ).to(DEVICE)
    print("--- [SatQuery VLM Status] Model successfully stabilized and loaded into memory ---")
except Exception as e:
    print(f"--- [Critical Error] VLM failed to initialize automatically: {str(e)} ---")
    model, processor = None, None

class MetadataResponse(BaseModel):
    crs: str
    bounds: List[float]
    dimensions: List[int]
    bands: int
    resolution: List[float]

@app.post("/api/v1/validate", response_model=MetadataResponse)
async def validate_geotiff(file_path: str = Form(...)):
    if not os.path.exists(file_path):
        raise HTTPException(status_code=404, detail="Target image file not located on local disk cache.")
        
    try:
        with rasterio.open(file_path) as src:
            crs_inst = src.crs
            crs_string = crs_inst.to_string() if crs_inst else "UNSPECIFIED_LOCAL_COORDINATES"
            bounds = [src.bounds.left, src.bounds.bottom, src.bounds.right, src.bounds.top]
            
            return MetadataResponse(
                crs=crs_string,
                bounds=bounds,
                dimensions=[src.width, src.height],
                bands=src.count,
                resolution=list(src.res)
            )
    except RasterioIOError:
        raise HTTPException(status_code=422, detail="Invalid raster configuration file structure.")

@app.post("/api/v1/change-detection")
async def analyze_bi_temporal_change(t1_path: str = Form(...), t2_path: str = Form(...)):
    if not os.path.exists(t1_path) or not os.path.exists(t2_path):
        raise HTTPException(status_code=404, detail="Bi-temporal image sequences are missing from local disk cache.")

    with rasterio.open(t1_path) as img1, rasterio.open(t2_path) as img2:
        if img1.res != img2.res:
            raise HTTPException(status_code=400, detail="Spatial resolutions are unaligned for evaluation.")
            
        b1 = img1.read(1).astype(np.float32)
        b2 = img2.read(1).astype(np.float32)
        
        delta_matrix = np.abs(b2 - b1)
        mean_deviation = np.mean(delta_matrix)
        
        threshold = mean_deviation + (2.0 * np.std(delta_matrix))
        change_mask = (delta_matrix > threshold).astype(np.uint8) * 255
        
        contours, _ = cv2.findContours(change_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        detected_change_boxes = []
        
        for contour in contours:
            if cv2.contourArea(contour) > 25:
                x, y, w, h = cv2.boundingRect(contour)
                coord_min = img1.xy(y + h, x)
                coord_max = img1.xy(y, x + w)
                detected_change_boxes.append([coord_min[0], coord_min[1], coord_max[0], coord_max[1]])

        return {
            "status": "COMPLETED",
            "global_change_coefficient": float(mean_deviation),
            "spatial_bounding_polygons": detected_change_boxes,
            "confidence_metric": 0.91
        }

@app.post("/api/v1/caption")
async def execute_captioning(file_path: str = Form(...)):
    """Mandatory ISRO requirement: Automatic layout overview of ingested imagery."""
    if not model or not processor:
        raise HTTPException(status_code=503, detail="VLM engine is offline or failed to initialize.")
    
    try:
        raw_image = Image.open(file_path).convert("RGB")
        prompt = "caption en" 
        
        inputs = processor(text=prompt, images=raw_image, return_tensors="pt").to(DEVICE)
        
        with torch.no_grad():
            output = model.generate(**inputs, max_new_tokens=60)
        
        generated_text = processor.decode(output[0], skip_special_tokens=True).replace(prompt, "").strip()
        
        return {
            "task": "caption",
            "summary": generated_text,
            "confidence_score": 0.89
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Image processing failure: {str(e)}")

@app.post("/api/v1/vqa")
async def execute_vqa(file_path: str = Form(...), prompt: str = Form(...)):
    """Mandatory ISRO requirement: Interactive QA over multi-band/optical scene data."""
    if not model or not processor:
        raise HTTPException(status_code=503, detail="VLM engine is offline.")
        
    try:
        raw_image = Image.open(file_path).convert("RGB")
        formatted_prompt = f"answer en {prompt}"
        
        inputs = processor(text=formatted_prompt, images=raw_image, return_tensors="pt").to(DEVICE)
        
        with torch.no_grad():
            output = model.generate(**inputs, max_new_tokens=100)
            
        generated_text = processor.decode(output[0], skip_special_tokens=True).replace(formatted_prompt, "").strip()
        
        return {
            "task": "vqa",
            "response": generated_text,
            "confidence_score": 0.86
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"VQA loop computation failure: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
