@GIRISH
This is the prompt  for the  PROBLEM IDENTIFICATION 

## Global Problem Intelligence & Opportunity Discovery System (GPIOS)

---

## 1. SYSTEM IDENTITY

Design a production-grade, evidence-driven, continuously learning intelligence ecosystem whose primary purpose is:

> **Discover, validate, rank, and continuously re-evaluate real-world problems according to their potential for large-scale positive impact, while distinguishing problem magnitude from solution opportunity, realizable impact, and causal impact.**

The system must not simply search for problems affecting the largest number of people.

It must identify problems where solving them could produce the greatest meaningful, scalable, sustainable, and measurable positive impact.

The system should be capable of discovering:

- global problems
- regional problems
- local problems
- emerging problems
- hidden problems
- underserved problems
- poorly solved problems
- rapidly growing problems
- systemic problems
- root problems
- bottleneck problems
- infrastructure problems
- problems with large second-order effects
- problems with large future impact
- problems where technological leverage can dramatically increase solution reach

The architecture must remain model-agnostic and evidence-driven.

Do NOT assume that neural networks are automatically the best model.

The system must experimentally determine whether neural networks, gradient boosting, ensembles, causal models, statistical models, or other approaches perform best for each task.

---

# 2. CORE PHILOSOPHY

The system must follow these principles:

### Principle 1 — Evidence over opinion

No important factor, weight, assumption, or ranking rule should be accepted merely because it sounds reasonable.

Every important component should have:

- evidence
- source
- confidence level
- assumptions
- limitations
- counterexamples
- validation method

Clearly distinguish:

- established fact
- empirical observation
- model assumption
- hypothesis
- inference
- prediction
- uncertainty

---

### Principle 2 — Never optimize only for population size

Population reach is important but insufficient.

A problem affecting 2 billion people with trivial inconvenience may be less important than a problem affecting 100 million people with severe, frequent, systemic consequences.

---

### Principle 3 — Separate problem magnitude from opportunity

The system must distinguish:

```text
Problem Magnitude
        ≠
Solution Opportunity
        ≠
Realizable Impact
        ≠
Actual Impact
```

---

### Principle 4 — Prediction is not causation

A predictive model may identify correlation without proving that solving a problem will create the predicted impact.

Therefore include a dedicated causal and counterfactual reasoning layer.

---

### Principle 5 — Model uncertainty explicitly

Every important prediction should contain:

- predicted value
- confidence
- uncertainty interval/range where appropriate
- evidence quality
- data completeness
- model version
- assumptions

Never present uncertain predictions as facts.

---

### Principle 6 — The system must challenge itself

The architecture must actively search for:

- counterexamples
- contradictory evidence
- missing variables
- selection bias
- survivorship bias
- confirmation bias
- measurement bias
- geographic bias
- demographic bias
- double counting
- correlation between factors
- Goodhart's Law
- model drift

---

# 3. HIGH-LEVEL SYSTEM ARCHITECTURE

Design the ecosystem around the following major layers:

```text
GLOBAL INFORMATION ENVIRONMENT
            │
            ▼
┌─────────────────────────────────────┐
│ 1. PROBLEM DISCOVERY ENGINE         │
└──────────────────┬──────────────────┘
                   ▼
┌─────────────────────────────────────┐
│ 2. PROBLEM EXTRACTION ENGINE        │
└──────────────────┬──────────────────┘
                   ▼
┌─────────────────────────────────────┐
│ 3. PROBLEM NORMALIZATION ENGINE     │
└──────────────────┬──────────────────┘
                   ▼
┌─────────────────────────────────────┐
│ 4. EVIDENCE & DATA ENGINE            │
└──────────────────┬──────────────────┘
                   ▼
┌─────────────────────────────────────┐
│ 5. FACTOR DISCOVERY & VALIDATION    │
└──────────────────┬──────────────────┘
                   ▼
┌─────────────────────────────────────┐
│ 6. PROBLEM MAGNITUDE ENGINE         │
└──────────────────┬──────────────────┘
                   ▼
┌─────────────────────────────────────┐
│ 7. PREDICTIVE INTELLIGENCE ENGINE   │
└──────────────────┬──────────────────┘
                   ▼
┌─────────────────────────────────────┐
│ 8. CAUSAL & COUNTERFACTUAL ENGINE   │
└──────────────────┬──────────────────┘
                   ▼
┌─────────────────────────────────────┐
│ 9. SYSTEMIC IMPACT ENGINE           │
└──────────────────┬──────────────────┘
                   ▼
┌─────────────────────────────────────┐
│10. FUTURE / FORESIGHT ENGINE        │
└──────────────────┬──────────────────┘
                   ▼
┌─────────────────────────────────────┐
│11. SOLUTION OPPORTUNITY ENGINE      │
└──────────────────┬──────────────────┘
                   ▼
┌─────────────────────────────────────┐
│12. FEASIBILITY & SCALABILITY ENGINE │
└──────────────────┬──────────────────┘
                   ▼
┌─────────────────────────────────────┐
│13. PRIORITIZATION ENGINE            │
└──────────────────┬──────────────────┘
                   ▼
┌─────────────────────────────────────┐
│14. HUMAN VALIDATION ENGINE          │
└──────────────────┬──────────────────┘
                   ▼
┌─────────────────────────────────────┐
│15. EXPERIMENT / MVP ENGINE          │
└──────────────────┬──────────────────┘
                   ▼
┌─────────────────────────────────────┐
│16. REAL-WORLD IMPACT ENGINE         │
└──────────────────┬──────────────────┘
                   ▼
┌─────────────────────────────────────┐
│17. LEARNING & MODEL UPDATE ENGINE   │
└──────────────────┬──────────────────┘
                   │
                   └──────────────► CONTINUOUS LOOP
```

---

# 4. PROBLEM DISCOVERY ENGINE

Design mechanisms for discovering problems from diverse sources.

Potential sources include:

- government datasets
- census datasets
- academic research
- scientific publications
- economic reports
- public policy reports
- industry reports
- company data
- customer complaints
- support tickets
- reviews
- surveys
- interviews
- social discussions
- search behavior
- news
- job postings
- procurement data
- operational failures
- infrastructure failures
- environmental data
- demographic changes
- technological trends
- financial data
- healthcare data where legally and ethically appropriate
- transportation data
- education data
- agricultural data
- energy data
- climate data
- open-source projects
- regulatory changes

Build source reliability scoring.

Do not treat every source as equally trustworthy.

---

# 5. PROBLEM EXTRACTION ENGINE

Convert raw information into structured problem statements.

Each problem should contain:

```text
Problem ID
Problem Title
Problem Description
Affected Population
Affected Geography
Affected Demographics
Context
Trigger
Frequency
Duration
Severity
Existing Solutions
Solution Gaps
Evidence
Source Reliability
Date Observed
Growth Trend
Dependencies
Related Problems
Root Causes
Consequences
Potential Interventions
```

Avoid confusing:

- symptom
- root cause
- consequence
- user complaint
- market opportunity

---

# 6. PROBLEM NORMALIZATION ENGINE

Different people may describe the same underlying problem differently.

Build an ontology/knowledge graph that identifies:

```text
Problem A
Problem B
Problem C
     │
     ▼
Potentially same underlying problem
```

Use:

- semantic similarity
- entity resolution
- causal relationships
- domain ontology
- knowledge graphs

Prevent duplicate counting of the same population/problem.

---

# 7. EVIDENCE ENGINE

For every important claim, store:

```text
Claim
Source
Source Type
Source Date
Evidence Strength
Methodology
Population Studied
Geographic Scope
Potential Bias
Contradictory Evidence
Confidence
```

Create an evidence hierarchy.

Example:

```text
Tier 1
High-quality primary empirical evidence

Tier 2
Government / institutional datasets

Tier 3
Peer-reviewed research

Tier 4
High-quality industry research

Tier 5
Surveys / interviews

Tier 6
Public reports / discussions

Tier 7
Unverified claims
```

Do not automatically rank sources solely by institution.

Evaluate methodology and relevance.

---

# 8. FACTOR DISCOVERY ENGINE

Do NOT permanently assume a fixed factor list.

The system must discover and evaluate candidate factors.

Candidate factors may include:

### Scale

- population affected
- geographic reach
- demographic reach

### Severity

- physical impact
- financial impact
- quality-of-life impact
- safety impact
- social impact

### Frequency

- occurrence frequency
- duration
- persistence
- recurrence

### Resource burden

- time lost
- money lost
- energy consumed
- material waste
- cognitive burden

### Opportunity characteristics

- underserved population
- existing solution weakness
- affordability gap
- accessibility gap
- adoption gap

### Dynamic characteristics

- growth rate
- acceleration
- emerging risk
- technological disruption
- demographic change

### System characteristics

- bottleneck position
- dependency centrality
- network effects
- second-order effects
- third-order effects
- systemic consequences

### Solution characteristics

- technical feasibility
- economic feasibility
- scalability
- distribution potential
- adoption probability
- cost-effectiveness
- implementation complexity

---

# 9. FACTOR VALIDATION ENGINE

This is a critical component.

For every candidate factor determine:

```text
Does it correlate with impact?
Does it independently contribute information?
Does it predict future impact?
Does it improve ranking quality?
Does it duplicate another factor?
Does it introduce bias?
Is it measurable?
Is it stable?
Can it be manipulated?
```

Perform:

- correlation analysis
- feature importance analysis
- ablation studies
- sensitivity analysis
- multicollinearity analysis
- out-of-sample testing
- historical backtesting

Do NOT arbitrarily assign weights.

Let empirical evidence inform them.

---

# 10. PROBLEM MAGNITUDE ENGINE

Estimate:

> How large and consequential is the problem itself?

Do not collapse everything immediately into one score.

Maintain separate dimensions:

```text
Reach
Severity
Frequency
Duration
Resource Burden
Economic Burden
Human Burden
Environmental Burden
Systemic Burden
Future Burden
```

Then generate a multidimensional profile.

---

# 11. PREDICTIVE INTELLIGENCE ENGINE

Build competing models.

At minimum evaluate:

```text
Baseline statistical models
Linear models
Regularized models
Decision trees
Random Forest
Gradient Boosting
XGBoost / LightGBM
Neural Networks
Ensemble models
```

For tabular data, do not assume neural networks are superior.

Benchmark models empirically.

Use:

- cross-validation
- temporal validation
- geographic holdout
- demographic holdout
- out-of-distribution testing where possible

The model should predict outcomes such as:

```text
Problem Magnitude
Future Growth
Demand
Potential Beneficiary Population
Potential Impact
Probability of Successful Intervention
```

---

# 12. CAUSAL ENGINE

Create a dedicated causal reasoning layer.

The system should distinguish:

```text
Correlation
       vs
Causation
```

Construct causal graphs where appropriate.

Identify:

- root causes
- mediators
- confounders
- downstream effects
- intervention points
- feedback loops

Evaluate suitable causal inference methods depending on the data.

Do not claim causality when only observational correlation exists.

---

# 13. COUNTERFACTUAL ENGINE

For each high-priority problem ask:

> What happens if nothing changes?

versus:

> What happens if the problem is successfully solved?

Estimate:

```text
Baseline trajectory
       vs
Intervention trajectory
       ↓
Difference
       ↓
Counterfactual impact
```

Evaluate multiple intervention scenarios:

```text
No intervention
Weak intervention
Moderate intervention
Strong intervention
Ideal intervention
```

---

# 14. SYSTEMIC IMPACT ENGINE

Do not stop at direct users.

Map:

```text
Problem
 ↓
Direct consequences
 ↓
Second-order consequences
 ↓
Third-order consequences
 ↓
System-level consequences
```

Use graph/network analysis to identify:

- bottlenecks
- hubs
- dependencies
- cascading effects
- leverage points
- systemic risks

A problem with moderate direct impact but enormous systemic leverage may receive high priority.

---

# 15. FUTURE FORESIGHT ENGINE

Estimate how the problem changes over:

```text
1 year
5 years
10 years
20 years
```

Consider:

- population changes
- technological change
- AI adoption
- automation
- climate
- urbanization
- aging
- migration
- economic changes
- geopolitical changes
- regulation
- infrastructure
- resource constraints

Generate multiple scenarios:

```textBaseline
Optimistic
Pessimistic
Disruptive
Worst-case
```

Do not present forecasts as certainty.

---

# 16. SOLUTION OPPORTUNITY ENGINE

After determining problem magnitude, analyze:

> What opportunity exists to solve it?

Evaluate:

```text
Existing solutions
Solution quality
Solution accessibility
Solution affordability
Solution effectiveness
Unserved population
Underserved population
Technology gaps
Distribution gaps
Integration gaps
```

Distinguish:

```textUnsolved problem
Poorly solved problem
Expensive problem
Inaccessible solution
Poorly distributed solution
Low-adoption solution
```

---

# 17. FEASIBILITY ENGINE

Evaluate whether a solution can realistically be created.

Factors:

```textTechnical feasibility
Economic feasibility
Infrastructure requirements
Data availability
Regulatory constraints
Legal constraints
Safety
Ethical constraints
Human adoption
Behavior change required
Distribution
Capital requirements
Operational complexity
Time to deployment
```

---

# 18. SCALABILITY / LEVERAGE ENGINE

Estimate:

> If the solution works once, how widely can it spread?

Measure:

```textUsers served per deployment
Marginal cost
Distribution speed
Geographic scalability
Digital scalability
Automation
Network effects
Platform effects
Infrastructure leverage
Reusability
Interoperability
```

Distinguish:

```textImpact of solving the problem
       vs
Impact of scalable solution
```

---

# 19. REALIZABLE IMPACT ENGINE

Create a distinction between:

```textPotential Impact
        ×
Probability of Successful Solution
        ×
Scalability
        ×
Adoption
        ×
Sustainability
        =
Realizable Impact
```

Do not treat this as a universal mathematical truth.

Treat it as a modeling framework whose formulation must be validated.

---

# 20. PRIORITIZATION ENGINE

Do not output only one ranking.

Generate multiple rankings:

### Global magnitude ranking

Largest problems.

### Human welfare ranking

Greatest improvement in human well-being.

### Economic opportunity ranking

Largest economic opportunity.

### Urgency ranking

Problems requiring immediate attention.

### Emerging-problem ranking

Problems likely to grow rapidly.

### Leverage ranking

Problems where one solution can unlock many benefits.

### Feasibility ranking

Problems most realistically solvable.

### Founder/startup ranking

Problems with high opportunity + feasible execution.

### Civilization-scale ranking

Problems with potentially enormous systemic effects.

---

# 21. UNCERTAINTY ENGINE

Every ranking must include uncertainty.

Example:

```text
Problem Score: 87

Confidence: 71%

Evidence Quality: High

Data Completeness: 64%

Prediction Range: 78–93

Major Unknowns:
- Future adoption
- Population estimate
- Causal effect
```

The system must distinguish:

```textHigh score + high confidence
High score + low confidence
Low score + high confidence
Low score + low confidence
```

These are very different situations.

---

# 22. ADVERSARIAL / RED TEAM ENGINE

Before recommending a problem, actively try to destroy the recommendation.

Ask:

```textWhat evidence contradicts this?
What assumptions are wrong?
Are we double-counting?
Is the population estimate inflated?
Is the problem actually caused by something else?
Would solving it merely move the problem elsewhere?
Could the intervention create negative externalities?
Are we ignoring people who benefit from the current system?
Are there regulatory barriers?
Is this a survivorship-bias artifact?
Are we optimizing the wrong metric?
```

Produce a:

> **Problem Recommendation Stress Test**

---

# 23. HUMAN VALIDATION ENGINE

No model should replace human reality.

For high-priority problems, require:

- interviews
- surveys
- expert review
- stakeholder validation
- field observation
- prototype testing

Compare:

```textModel belief
       vs
Human experience
```

Record disagreements.

Disagreements should become learning signals.

---

# 24. EXPERIMENT ENGINE

For promising opportunities, design the smallest experiment that can reduce uncertainty.

Examples:

```textInterview
Survey
Landing page
Prototype
Pilot
A/B test
Simulation
Field experiment
Operational trial
```

The goal is not immediately:

> Build the full product.

The goal is:

> **Maximize information gained per unit of effort.**

---

# 25. REAL-WORLD IMPACT ENGINE

Once an intervention exists, measure actual outcomes.

Track:

```textPeople reached
People benefiting
Benefit per person
Time saved
Money saved
Income created
Risk reduced
Quality-of-life improvement
Environmental impact
Systemic effects
Adoption
Retention
Unintended consequences
```

Compare:

```textPredicted impact
       vs
Actual impact
```

This is essential.

---

# 26. CONTINUOUS LEARNING ENGINE

Feed real-world outcomes back into the system.

```textPrediction
     ↓
Intervention
     ↓
Actual outcome
     ↓
Prediction error
     ↓
Model update
     ↓
Factor update
     ↓
Architecture update
```

The system must learn not only:

> Which problems are important?

but also:

> **Which characteristics were actually predictive of successful impact?**

---

# 27. KNOWLEDGE GRAPH

Build a continuously evolving graph:

```textPeople
Problems
Causes
Effects
Organizations
Industries
Technologies
Solutions
Evidence
Policies
Markets
Geographies
Resources
Interventions
Outcomes
```

Relationships:

```textCAUSES
AFFECTS
DEPENDS_ON
SOLVES
WORSENS
CORRELATES_WITH
EVIDENCE_FOR
CONTRADICTS
ENABLES
BLOCKS
AMPLIFIES
REDUCES
```

This graph should become the system's long-term institutional memory.

---

# 28. PROBLEM DNA

Every problem should receive a structured "Problem DNA".

Example:

```text
Problem ID:
Category:
Population:
Reach:
Severity:
Frequency:
Duration:
Economic burden:
Human burden:
Growth:
Existing solution quality:
Underserved gap:
Systemic leverage:
Future risk:
Feasibility:
Scalability:
Evidence quality:
Confidence:
Causal confidence:
Counterfactual impact:
Realizable impact:
Uncertainty:
```

This allows different problems to be compared systematically.

---

# 29. MULTI-AGENT ECOSYSTEM

Design specialized agents.

Possible agents:

```textDiscovery Agent
Research Agent
Evidence Agent
Data Agent
Problem Structuring Agent
Ontology Agent
Factor Discovery Agent
Statistical Agent
ML Prediction Agent
Causal Inference Agent
Counterfactual Agent
Foresight Agent
Systems Thinking Agent
Solution Agent
Feasibility Agent
Economics Agent
Ethics Agent
Red Team Agent
Human Research Agent
Experiment Agent
Impact Measurement Agent
Model Evaluation Agent
Orchestrator Agent
```

Do not create agents merely for complexity.

Every agent must have:

- clear responsibility
- input
- output
- evaluation criteria
- failure conditions

---

# 30. ORCHESTRATOR

Create a central orchestration layer.

Responsibilities:

```textTask decomposition
Agent routing
Evidence verification
Conflict resolution
Model selection
Confidence management
Workflow management
Human escalation
Experiment selection
Knowledge updates
```

The orchestrator must NOT blindly trust any individual agent.

---

# 31. MODEL SELECTION ENGINE

For every predictive task:

```textCandidate models
       ↓
Train
       ↓
Validate
       ↓
Compare
       ↓
Stress test
       ↓
Interpret
       ↓
Select
```

Possible models:

```textLinear
Logistic
Bayesian
Decision Tree
Random Forest
Gradient Boosting
XGBoost
LightGBM
Neural Network
Graph Neural Network
Ensemble
Causal Models
Time-series Models
```

Model choice must be empirical.

---

# 32. EXPLAINABILITY

For every important recommendation answer:

> Why did the system rank this problem highly?

Provide:

```textTop contributing factors
Evidence
Model contribution
Historical analogues
Causal reasoning
Counterfactual reasoning
Uncertainty
Contradictory evidence
```

Do not provide fabricated explanations.

If a model cannot reliably explain a prediction, explicitly state the limitation.

---

# 33. BIAS & ETHICS ENGINE

Continuously evaluate:

- demographic bias
- geographic bias
- income bias
- data availability bias
- language bias
- digital-access bias
- historical bias
- survivorship bias
- selection bias

Also evaluate:

- privacy
- safety
- unintended consequences
- exploitation
- environmental effects
- distributional effects

A problem affecting fewer people must not automatically become irrelevant if the affected population is extremely vulnerable.

---

# 34. SECURITY & DATA GOVERNANCE

Design:

- access control
- encryption
- audit logs
- provenance
- source verification
- data lineage
- privacy controls
- sensitive-data handling
- model governance
- versioning
- rollback
- monitoring

---

# 35. SYSTEM ENVIRONMENT

Design the complete technical environment.

Include:

### Data Layer

- relational database
- vector database
- knowledge graph
- data lake/object storage

### Processing

- ETL/ELT
- stream processing
- batch processing

### AI/ML

- model registry
- feature store where justified
- experiment tracking
- evaluation pipeline
- model serving

### Application

- API layer
- orchestration layer
- dashboard
- analyst interface

### Infrastructure

- containerization
- CI/CD
- monitoring
- logging
- observability
- backup
- disaster recovery

Prefer modularity and replaceability.

---

# 36. OUTPUT OF THE SYSTEM

For every high-priority problem generate:

## Problem Brief

```textProblem
Who experiences it?
Where?
How many?
How often?
How severe?
Why does it exist?
Why hasn't it been solved?
Existing solutions
Evidence
Contradictory evidence
Root causes
Systemic effects
Future trajectory
Potential interventions
Feasibility
Scalability
Potential impact
Realizable impact
Confidence
Uncertainty
```

Then produce:

### Recommendation

```textPriority:
Why:
Evidence:
Key assumptions:
Major uncertainties:
Arguments against:
Best intervention opportunities:
Next experiment:
```

---

# 37. THE MOST IMPORTANT DESIGN REQUIREMENT

Do NOT create a fixed "magic score."

Instead create a hierarchy:

```textEvidence
   ↓
Factors
   ↓
Factor validation
   ↓
Models
   ↓
Prediction
   ↓
Causal analysis
   ↓
Counterfactual analysis
   ↓
Systemic analysis
   ↓
Feasibility
   ↓
Realizable impact
   ↓
Human validation
   ↓
Experiment
   ↓
Actual impact
   ↓
Learning
```

The scoring system itself must be continuously tested.

---

# 38. GOLD-STANDARD EVALUATION

The system must eventually be evaluated against historical cases.

Construct a benchmark dataset containing:

```textSuccessful high-impact interventions
Successful low-impact interventions
Failed high-potential ideas
Moderate-impact interventions
Large-scale interventions
Small-scale interventions
Unexpected breakthroughs
Unexpected failures
```

Then ask:

> Could the system have identified the high-impact opportunities before their outcomes were known?

Prevent leakage of future information.

Use temporal validation.

---

# 39. SUCCESS METRICS

Do not evaluate the system merely on prediction accuracy.

Measure:

```textRanking quality
Calibration
Precision@K
Recall@K
Prediction error
Counterfactual accuracy where measurable
Impact prediction accuracy
False-positive rate
False-negative rate
Evidence quality
Human validation agreement
Experiment success rate
Actual impact prediction error
Model drift
Bias metrics
```

Most importantly:

> **Does the system consistently help humans identify opportunities that create meaningful real-world impact?**

---

# 40. FINAL SYSTEM LOOP

The finished ecosystem should behave like this:

```text
                    WORLD
                     │
                     ▼
              OBSERVE PROBLEMS
                     │
                     ▼
             COLLECT EVIDENCE
                     │
                     ▼
             STRUCTURE PROBLEMS
                     │
                     ▼
          DISCOVER / VALIDATE FACTORS
                     │
                     ▼
              PREDICT MAGNITUDE
                     │
                     ▼
             ANALYZE CAUSALITY
                     │
                     ▼
            RUN COUNTERFACTUALS
                     │
                     ▼
             ANALYZE SYSTEM EFFECTS
                     │
                     ▼
              FORECAST FUTURE
                     │
                     ▼
           ANALYZE SOLUTION SPACE
                     │
                     ▼
             TEST FEASIBILITY
                     │
                     ▼
             ESTIMATE LEVERAGE
                     │
                     ▼
           ESTIMATE REALIZABLE IMPACT
                     │
                     ▼
                RED TEAM
                     │
                     ▼
             HUMAN VALIDATION
                     │
                     ▼
                 EXPERIMENT
                     │
                     ▼
             REAL-WORLD OUTCOME
                     │
                     ▼
          COMPARE PREDICTED vs ACTUAL
                     │
                     ▼
               LEARN / UPDATE
                     │
                     └──────────────► WORLD
```

---

# 41. FINAL DESIGN PRINCIPLE

The system should never claim:

> "This is objectively the most important problem in the world."

Instead it should say:

> **"Given the available evidence, assumptions, models, uncertainty, and current world state, this problem currently has the highest estimated realizable positive impact among the evaluated opportunities."**

That distinction makes the system intellectually honest.

---

# 42. YOUR ORIGINAL NEURAL-NETWORK IDEA

Keep it.

But position it here:

```text
                    PROBLEM INTELLIGENCE SYSTEM
                              │
             ┌────────────────┼────────────────┐
             │                │                │
       Statistical        ML Prediction     Causal/
         Models             Models         Counterfactual
             │                │                │
             └────────────────┼────────────────┘
                              ▼
                        MODEL ENSEMBLE
                              │
                              ▼
                     IMPACT ESTIMATION
```

The neural network is therefore **one powerful component**, not the entire brain.

And if experiments demonstrate that a neural network performs worse than gradient boosting on the available problem dataset, the system should choose gradient boosting.

**The architecture must be loyal to the objective, not loyal to a particular technology.**

---

# 43. FINAL OBJECTIVE

The ultimate objective of GPIOS is:

> **Continuously discover the world's most consequential, underserved, solvable, scalable, and systemically important problems; estimate their potential impact using evidence, predictive modeling, causal reasoning, counterfactual analysis, and future forecasting; validate those estimates through human research and real-world experiments; and continuously learn from actual outcomes.**

Do not optimize for:

> "the largest number of users."

Optimize for:

> **the greatest credible, measurable, sustainable, and realizable positive impact.**




Approach 2) 

# SIH 2026 SOFTWARE PROBLEM INTELLIGENCE — EXECUTION DIRECTIVE

You have access to the project's dataset containing the 172 SIH 2026 SOFTWARE problem statements in:

data/sih_2026_172.csv
data/sih_2026_172.json

Your mission is NOT simply to generate a score.

Your mission is:

> Identify which SIH 2026 software problem statement is the strongest real-world and execution opportunity for us, using an evidence-driven, multi-stage research methodology.

The ultimate output must identify:

1. Top 10 real-world impact problems
2. Top 10 solution opportunities
3. Top 10 systemic-leverage problems
4. Top 10 future-potential problems
5. Top 10 SIH opportunities
6. Overall Top 10
7. Top 5 finalists
8. Top 3 finalists
9. #1 highest real-world impact
10. #1 best SIH opportunity
11. #1 strongest business opportunity
12. Overall #1 recommendation

===========================================================
IMPORTANT: DO NOT EXECUTE THE OLD HEURISTIC PLAN
===========================================================

Do NOT use keyword counts as proof of:

- population impact
- severity
- economic impact
- systemic leverage
- future importance
- feasibility
- scalability
- opportunity

Do NOT assign arbitrary weights simply because they appear reasonable.

Do NOT train a neural network on only these 172 statements.

Do NOT fabricate statistics, evidence, sources, users, market sizes, or impact numbers.

Do NOT eliminate potentially strong problems merely because keyword-based heuristics give them a low score.

The previous implementation plan was only a starting proposal.

Replace the heuristic-heavy approach with the hybrid research architecture below.

===========================================================
HYBRID ARCHITECTURE
===========================================================

Use the appropriate method for each task:

PYTHON
-------
Use Python for:

- CSV/JSON validation
- data cleaning
- normalization
- duplicate detection
- embeddings
- semantic similarity
- clustering
- numerical calculations
- statistics
- sensitivity analysis
- ranking calculations
- reproducibility
- generating structured output files

LLM
---
Use LLM reasoning for:

- understanding the underlying problem
- distinguishing problem vs symptom
- identifying stakeholders
- identifying root causes
- extracting candidate factors
- qualitative reasoning
- systemic analysis
- solution analysis
- future analysis
- contradiction generation
- red-team analysis
- final synthesis

WEB RESEARCH
------------
Use reliable external sources for:

- population estimates
- prevalence
- economic impact
- research evidence
- existing solutions
- market information
- government information
- technical feasibility
- future trends

STATISTICS / ML
---------------
Use for:

- factor relationships
- correlation analysis
- clustering
- similarity
- exploratory predictive analysis
- sensitivity analysis

Do NOT claim predictive superiority without appropriate labeled data.

===========================================================
CORE PRINCIPLE
===========================================================

Treat every proposed factor as a hypothesis.

Do not assume the following factors are automatically correct:

- population
- severity
- frequency
- duration
- economic burden
- time burden
- underserved population
- existing solution weakness
- growth
- urgency
- systemic leverage
- future risk
- feasibility
- scalability
- innovation
- technology leverage

For every important factor determine:

1. Why it might matter
2. Evidence supporting it
3. Evidence contradicting it
4. Whether it is measurable
5. Whether it overlaps with another factor
6. Whether it creates double counting
7. Whether it is reliable
8. Whether it appears useful for ranking problems

Classify conclusions as:

[FACT]
[EVIDENCE-SUPPORTED]
[HYPOTHESIS]
[INFERENCE]
[ESTIMATE]
[UNCERTAIN]

===========================================================
IMPORTANT DISTINCTIONS
===========================================================

Never collapse these concepts:

Problem Magnitude
≠
Problem Importance
≠
Opportunity
≠
Potential Impact
≠
Realizable Impact
≠
Actual Impact
≠
Solution Feasibility
≠
SIH Competitiveness

Maintain them as separate dimensions.

===========================================================
PASS 0 — DATASET VALIDATION
===========================================================

Before any analysis:

1. Load CSV.
2. Load JSON.
3. Count records.
4. Count unique PS IDs.
5. Check duplicate IDs.
6. Compare CSV and JSON.
7. Identify missing records.
8. Identify mismatched fields.
9. Verify all records belong to the SOFTWARE domain.
10. Report all discrepancies.

Do not modify source files.

Create:

research/00_dataset_validation.md

===========================================================
PASS 1 — NORMALIZATION
===========================================================

For every problem create a normalized record containing:

- PS ID
- original title
- original problem statement
- organization
- department if available
- theme
- domain
- underlying problem
- target users
- stakeholders
- geography
- root causes if known
- symptoms
- consequences
- existing solution information
- expected solution
- technical requirements
- constraints
- unknown information

Never overwrite the original statement.

Create:

research/01_normalized_problems.csv
research/01_normalized_problems.json

===========================================================
PASS 2 — RELATIONSHIP / DUPLICATE ANALYSIS
===========================================================

Use:

embeddings
→ semantic similarity
→ candidate pairs
→ LLM verification

Identify:

- exact duplicates
- semantic duplicates
- same underlying problem
- strongly related problems
- complementary problems
- independent problems

Do NOT automatically delete related problems.

Create:

research/02_problem_relationships.csv

===========================================================
PASS 3 — FACTOR VALIDATION
===========================================================

Before ranking problems, investigate whether our candidate evaluation factors are actually meaningful.

Candidate dimensions:

A. SCALE
- affected population
- geographic reach

B. INTENSITY
- severity
- frequency
- duration

C. BURDEN
- economic burden
- time burden
- resource burden
- human burden
- environmental burden

D. GAP
- underserved population
- unserved population
- existing solution weakness
- affordability
- accessibility
- adoption gap

E. FUTURE
- growth
- urgency
- future risk
- technology change

F. SYSTEMIC
- root-cause position
- dependencies
- second-order effects
- third-order effects
- bottleneck potential
- systemic leverage

G. SOLUTION
- feasibility
- data availability
- scalability
- adoption
- implementation complexity
- technology leverage

H. SIH
- innovation
- prototype feasibility
- technical depth
- demonstrability
- differentiation
- deployment realism

Do NOT assign weights yet.

Create:

research/03_factor_validation.md

===========================================================
PASS 4 — EVIDENCE COLLECTION
===========================================================

For every problem collect evidence where meaningful.

Research:

- affected population
- prevalence
- severity
- frequency
- duration
- economic burden
- time burden
- resource burden
- existing solutions
- solution effectiveness
- solution gaps
- underserved groups
- growth
- future importance
- systemic consequences

For every important quantitative claim record:

Claim
Source
Source type
Publication/date
Relevant geography
Evidence quality
Potential bias
Confidence

Never fabricate evidence.

If unavailable:

UNKNOWN

If estimated:

ESTIMATE

If sources disagree:

record the disagreement.

Create:

research/04_evidence_database.csv

===========================================================
PASS 5 — PROBLEM DNA
===========================================================

Create a structured profile for every problem.

Include:

- impact dimensions
- opportunity dimensions
- future dimensions
- systemic dimensions
- solution dimensions
- SIH dimensions
- evidence quality
- confidence
- uncertainty
- assumptions

Create:

research/05_problem_dna.csv

===========================================================
PASS 6 — FIRST SCREENING
===========================================================

Do NOT aggressively eliminate problems based on keywords.

Use:

- evidence quality
- problem validity
- duplicate/overlap status
- impact signals
- opportunity signals
- feasibility signals

Reduce the dataset gradually.

Target approximately:

172
→ 100
→ 50
→ 30

Do not force exact numbers.

A strong problem must not be eliminated merely because its evidence is difficult to quantify.

===========================================================
PASS 7 — MULTI-DIMENSIONAL ANALYSIS
===========================================================

For each surviving problem evaluate separately:

1. Real-world impact
2. Problem magnitude
3. Human impact
4. Economic/resource impact
5. Solution opportunity
6. Systemic leverage
7. Future potential
8. Technical feasibility
9. Scalability
10. SIH competitiveness
11. Evidence confidence

Do not immediately collapse these into one score.

Create separate rankings.

===========================================================
PASS 8 — SYSTEMIC + COUNTERFACTUAL ANALYSIS
===========================================================

For strong candidates analyze:

Problem
↓
Root causes
↓
Direct consequences
↓
Second-order effects
↓
Third-order effects
↓
System-level effects

Then compare:

No intervention
vs
Weak intervention
vs
Successful intervention

Do not claim precise causal effects without evidence.

===========================================================
PASS 9 — DEEP RESEARCH TOP 15
===========================================================

For the strongest approximately 15 candidates, perform deeper research.

Investigate:

- primary sources
- government sources
- academic research
- industry evidence
- existing solutions
- competitors
- technology feasibility
- adoption barriers
- data availability
- regulatory issues
- deployment constraints
- scalability

Do not merely repeat the initial analysis.

===========================================================
PASS 10 — SOLUTION OPPORTUNITY
===========================================================

For each finalist determine:

- what already exists
- what works
- what doesn't work
- why the gap remains
- what software could change
- whether AI/ML is actually useful
- what data is required
- deployment requirements
- scalability
- adoption
- cost

Do NOT reward AI/ML merely because it sounds advanced.

===========================================================
PASS 11 — SIH COMPETITIVENESS
===========================================================

Evaluate:

- problem clarity
- real-world relevance
- innovation potential
- technical depth
- prototype feasibility
- demonstrability
- differentiation
- scalability
- deployment realism
- measurable impact
- ability to create a compelling demo
- ability to explain the solution clearly

Remember:

The most important real-world problem is not necessarily the best SIH problem.

===========================================================
PASS 12 — RED TEAM
===========================================================

For every Top 10 candidate ask:

WHY SHOULD WE NOT CHOOSE THIS?

Attack:

- evidence quality
- population assumptions
- severity assumptions
- existing solutions
- feasibility
- adoption
- data requirements
- technical complexity
- regulatory barriers
- scalability
- differentiation
- systemic impact
- future assumptions
- business assumptions

Every Top 10 candidate must have:

"Why we might be wrong"

===========================================================
PASS 13 — FINAL COMPARISON
===========================================================

Create separate rankings:

A. Top 10 — Real-World Impact
B. Top 10 — Solution Opportunity
C. Top 10 — Systemic Leverage
D. Top 10 — Future Potential
E. Top 10 — Technical Feasibility
F. Top 10 — Scalability
G. Top 10 — SIH Competitiveness
H. Top 10 — Overall Opportunity

===========================================================
FINAL TOP 10
===========================================================

For every Top 10 problem provide:

PS ID
Title
Organization
Theme

Real-world impact
Solution opportunity
Systemic leverage
Future potential
Technical feasibility
Scalability
SIH competitiveness
Evidence confidence

Then explain:

Why it is Top 10
Why it beats alternatives
Strongest evidence
Weakest assumption
Existing solutions
Unsolved gap
Possible solution direction
Second-order effects
Biggest risks
Why we might be wrong

===========================================================
FINAL TOP 5
===========================================================

Perform a deep comparison.

Do not simply sort by total score.

Explain trade-offs.

===========================================================
FINAL TOP 3
===========================================================

Identify:

#1 Real-World Impact
#1 Solution Opportunity
#1 SIH Opportunity
#1 Business Opportunity

These may be different.

===========================================================
FINAL #1
===========================================================

Select ONE overall recommendation only after all analysis.

Answer:

"If I had to spend the next several months building ONE software solution from these 172 SIH 2026 problem statements, which problem should I choose and why is it better than every serious alternative?"

Provide:

Problem ID
Problem
Overall rank
Real-world impact
Solution opportunity
Systemic leverage
Future potential
Feasibility
Scalability
SIH competitiveness
Evidence confidence
Why #1
Why alternatives lost
Existing solutions
Unsolved gap
Recommended solution direction
Prototype direction
Technical architecture direction
Business potential
SIH strategy
Biggest risks
Why we might be wrong
What evidence could change the decision

===========================================================
OUTPUT FILES
===========================================================

Create:

research/
├── 00_dataset_validation.md
├── 01_normalized_problems.csv
├── 01_normalized_problems.json
├── 02_problem_relationships.csv
├── 03_factor_validation.md
├── 04_evidence_database.csv
├── 05_problem_dna.csv
├── 06_initial_ranking.csv
├── 07_top30_analysis.md
├── 08_top15_deep_research.md
├── 09_top10_analysis.md
├── 10_red_team.md
├── 11_top5_comparison.md
├── 12_top3_finalists.md
└── FINAL_RECOMMENDATION.md

rankings/
├── real_world_impact.csv
├── opportunity.csv
├── systemic_leverage.csv
├── future_potential.csv
├── feasibility.csv
├── scalability.csv
├── sih_competitiveness.csv
└── overall_ranking.csv

audit/
├── sources.csv
├── claims.csv
├── assumptions.csv
├── uncertainties.csv
└── analysis_log.md

===========================================================
EXECUTION RULE
===========================================================

DO NOT execute the entire pipeline in one pass.

Execute stage-by-stage.

After each stage:

1. Save outputs.
2. Validate outputs.
3. Report what was completed.
4. Report uncertainties.
5. Report errors.
6. Report how many records remain.
7. Do not silently continue if a major data problem exists.

Start with PASS 0 ONLY.

Do NOT rank any problem yet.

Do NOT perform deep research yet.

First verify the dataset.
