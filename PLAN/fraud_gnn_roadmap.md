# Dynamic Spatio-Temporal GNN for Real-Time Fraud Topology & AML
## Implementation Roadmap

---

## 🛠️ Phase 1: Environment Setup & Data Pipeline (Weeks 1–2)

### Infrastructure Provisioning
* **Cloud Instance:** Provision an Oracle Cloud Infrastructure (OCI) Always Free Ampere A1 Compute instance configured with 4 ARM Cores and 24GB RAM.
* **Operating System:** Deploy an Ubuntu 22.04 LTS or Debian 12 ARM64 minimal server image.
* **Network & Security:** Set up strict security lists, configuring ingress rules for port `7687` (Bolt protocol for graph communication) and port `3000` (monitoring dashboard).

### Graph Database Initialization
* **Deployment:** Install and launch Memgraph Platform via Docker using the official ARM64 optimized image (`memgraph/memgraph-platform:latest`).
* **Memory Allocation:** Explicitly configure Memgraph's internal storage parameters within `memgraph.conf` to allocate 16GB of the available 24GB RAM strictly to the in-memory database engine.

### Ingestion Pipeline Construction
* **Dataset Preparation:** Download and pre-process the Elliptic Data Set (Anti-Money Laundering) alongside Kaggle Synthetic Financial Datasets.
* **Schema Mapping:** Map the tabular relational records to an optimized graph schema containing Nodes (`Account`, `Transaction`) and Edges (`TRANSFERRED_TO`, `OWNED_BY`).
* **Temporal Tracking:** Append a mandatory temporal edge attribute (`timestamp`) to track and preserve sequence windows.

---

## 🔬 Phase 2: Feature Engineering & Spatio-Temporal Modeling (Weeks 3–5)

### Graph Topological Feature Extraction
* **Baseline Analytics:** Leverage the Memgraph MAGE (Graph Analytics Engine) library to compute static topological baselines.
* **Metric Engineering:** Periodically extract structural node metrics including In-degree, Out-degree, PageRank scores, and Local Clustering Coefficients per entity.

### ST-GNN Architecture Selection
* **Framework:** Build a customized Spatio-Temporal Graph Neural Network (ST-GNN) using PyTorch Geometric (PyG).
* **Spatial Component:** Implement a Graph Attention Network (GATv2) layer to adaptively weigh multi-hop transaction topologies.
* **Temporal Component:** Stack a Gated Recurrent Unit (GRU) or Gated Graph ConvNet layer to process structural shifts across sliding time-series windows.

### Model Training & Loss Function Design
* **Memory Management:** Implement structural neighbor sampling (`NeighborSampler`) to stream-train over large graphs without running out of RAM.
* **Loss Functions:** Use `BCEWithLogitsLoss` for supervised node classification (Licit vs. Illicit). 
* **Self-Supervised Regularization:** Integrate an unsupervised contrastive loss element to flag hidden structural anomalies such as synthetic identity rings.

---

## ⚡ Phase 3: Model Optimization & ARM Compilation (Weeks 6–7)

### ONNX Model Export
* **Weight Freezing:** Finalize training iterations, evaluate checkpoints, and freeze PyTorch model weights.
* **Tracing:** Export the PyG message-passing layers to ONNX format via `torch.onnx.export`.
* **Dynamic Geometry:** Configure dynamic axes for input arrays to support runtime variations in subgraph sizes and batch volumes.

### ARM CPU Quantization
* **Quantization Pipeline:** Pass the exported ONNX model through the ONNX Runtime (ORT) quantization toolkit.
* **Precision Downgrade:** Convert weights from FP32 down to optimized INT8 precision.
* **Hardware Acceleration:** Ensure operations map seamlessly onto ARM NEON execution registers to maximize math operation speeds purely on the CPU.

### Inference Engine Prototyping
* **Execution Wrapper:** Draft a lightweight inference container using the `onnxruntime` Python execution bindings.
* **Accuracy Auditing:** Verify that precision loss following INT8 quantization does not cross an acceptable <1.5% accuracy baseline threshold.

---

## 🔌 Phase 4: Memgraph Real-Time Integration (Weeks 8–9)

### Memgraph Query Custom Modules
* **Module Architecture:** Write a native C++ or Python Query Module utilizing Memgraph’s custom query extension API.
* **Runtime Initialization:** Bundle the optimized `onnxruntime` environment directly inside the initialization lifecycle of the query module.

### Trigger-Based Inference
* **Database Triggers:** Establish an automated internal transactional database trigger: `ON (:Transaction) CREATE...`
* **Real-time Extraction:** Configure the trigger to isolate the localized k-hop topological subgraph surrounding the new transaction event.
* **Scoring Pipeline:** Pass the extracted neighborhood parameters immediately to the runtime engine session for real-time risk rating.

### Subgraph Isolation Logic
* **Risk Categorization:** Evaluate incoming metrics; if an output score breaches the threshold (>0.85), dynamically mutate the node label to `:Illicit`.
* **Ring Separation:** Trigger graph traversal routines to group connected illicit entities, isolating suspected money laundering networks instantly.

---

## 🏋️ Phase 5: Rigorous Stress Testing & Optimization (Week 10)

### Load Testing and Scaling
* **Traffic Emulation:** Spin up a background transaction generation pipeline using toolkits like Locust or Apache JMeter.
* **Throughput Target:** Flood the pipeline with parallel payloads to confirm continuous performance at the required **50 to 100 Transactions Per Second (TPS)** boundary.

### Resource Bottleneck Analysis
* **Profiling:** Deploy low-level telemetry systems (`htop`, `perf`, and internal Memgraph profile logs) to track systemic utilization.
* **Thread Tuning:** Optimize internal multi-threading boundaries, memory garbage collection intervals, and connection pools.
* **Core Optimization:** Manage CPU affinity settings to guarantee that Memgraph database processes do not conflict with the ONNX runtime for ARM clock cycles.

---

## 📊 Phase 6: Dashboarding & Deployment Finalization (Weeks 11–12)

### Alerting Dashboard Setup
* **Backend Engines:** Spin up a resilient, lightweight API gateway layer utilizing FastAPI.
* **Visual Interface:** Build interactive, graph-aware operator dashboards via Memgraph Lab or Cytoscape.js layouts.
* **Analyst Alerting:** Stream flagged transaction alerts to the UI, highlighting anomalous subgraphs for human verification.

### Production Hardening
* **Resiliency Management:** Configure automated incremental database snapshots and logging policies for the Memgraph engine storage layer.
* **Lifecycle Automation:** Set up `systemd` supervisor daemons to ensure automated process recovery if an out-of-memory or system crash occurs.
* **API Documentation:** Expose clear, OpenAPI-compliant routing structures for all operational endpoints (`/predict`, `/ingest`, `/health`).
