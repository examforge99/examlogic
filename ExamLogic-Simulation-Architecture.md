# ExamLogic — Simulation Engine Master Architecture Document
### Version 1.0 | JAMB CBT Simulation Pipeline

---

## Philosophy

The objective of ExamLogic is not to randomly fetch questions.

The objective is to generate statistically fair, unpredictable, and realistic JAMB CBT simulations while maintaining consistency in overall difficulty and syllabus coverage.

The system controls the quality of the generated exam — it does not simply return random questions.

---

## Overall Pipeline Flow

```
POST /api/simulation/start
        ↓
Fetch User Subject Combination
        ↓
Select Simulation Templates (difficulty)
        ↓
Select Topic Combo Templates (per subject)
        ↓
Topic-Difficulty Allocation Engine
        ↓
Question Retrieval Pipeline
        ↓
Candidate Scoring Pipeline
        ↓
Constraint Resolution Pipeline
        ↓
Session Validation Pipeline
        ↓
CBT Session Engine
        ↓
Return Session to Frontend
```

---

## Subject Question Count

JAMB standard question count per subject in a simulation session:

```
English Language → 60 questions
Subject 2        → 40 questions
Subject 3        → 40 questions
Subject 4        → 40 questions

Total session    → 180 questions
Duration         → 108 minutes (6480 seconds)
```

The user's subject combination is fetched from their profile at session start. It is never passed in the request payload.

---

## Difficulty System

### Difficulty Levels

```
Level 1 = Very Easy  (1 point)
Level 2 = Easy       (2 points)
Level 3 = Medium     (3 points)
Level 4 = Hard       (4 points)
Level 5 = Very Hard  (5 points)
```

### Tolerance

```
Target average  = 3.50
Hard floor      = 3.30
Hard ceiling    = 3.70
```

The tolerance range is the only inviolable constraint in the entire pipeline. Template distributions are targets — the tolerance range is law.

---

## Engine 1 — Simulation Template Engine

### Purpose

Defines the statistical difficulty blueprint for each simulation. Completely independent of subjects, topics, questions, and users.

### Template Structure

```
simulation_templates {
  id
  question_count         → 40 or 60
  target_average         → 3.50
  tolerance_min          → 3.30
  tolerance_max          → 3.70
  difficulty_distribution (JSON) {
    level1_percent
    level2_percent
    level3_percent
    level4_percent
    level5_percent
  }
  status                 → available | deprecated
  created_at
}
```

### Template Generation Rules

1. Generate a candidate difficulty distribution
2. Compute total difficulty points: `sum(level × count)` for all levels
3. Compute average: `total_points / question_count`
4. Verify average falls within 3.30 – 3.70
5. Save if valid, discard if not

### Example — 40-Question Template

```
Level 1 →  5% =  2 questions × 1 =  2 points
Level 2 → 15% =  6 questions × 2 = 12 points
Level 3 → 40% = 16 questions × 3 = 48 points
Level 4 → 30% = 12 questions × 4 = 48 points
Level 5 → 10% =  4 questions × 5 = 20 points

Total points = 130
Average      = 130 / 40 = 3.25 ← DISCARD

Adjusted:
Level 3 → 14 questions × 3 = 42
Level 4 → 14 questions × 4 = 56
Total = 132 / 40 = 3.30 ← ACCEPT (at floor)
```

### Template Pool

- Pool size: 100 templates per question count type (40 and 60)
- Two separate pools maintained independently
- Refill threshold: 30% availability per pool
- Refill is async and non-blocking — never delays a user session

### Template Consumption — Per User

Templates are global and reusable across users. A template becomes invalid only for the user who consumed it.

```
user_template_history {
  user_id
  template_id
  session_id
  used_at
}
```

Selection query excludes templates already in the user's history:

```sql
SELECT * FROM simulation_templates
WHERE question_count = $count
AND status = 'available'
AND id NOT IN (
  SELECT template_id FROM user_template_history
  WHERE user_id = $userId
)
ORDER BY id ASC
LIMIT 1
FOR UPDATE SKIP LOCKED
```

### Template Selection Per Session

```
1 template (question_count = 60) → English
3 templates (question_count = 40) → remaining subjects
4 templates total per session
All 4 inserted into user_template_history atomically
```

### Refill Logic

```
On every simulation request (async, non-blocking):

available_60 / total_60 < 0.30 → trigger refill for 60-question pool
available_40 / total_40 < 0.30 → trigger refill for 40-question pool

Pools refill independently.
```

---

## Engine 2 — Subject Topic Template Engine

### Purpose

Pre-generates valid topic combinations per subject using the official JAMB syllabus. Parallel to difficulty templates — consumed per user, global pool.

### JAMB Syllabus Foundation

The topics table is pre-seeded with all official JAMB syllabus topics. The syllabus is the source of truth. The question bank fills in underneath it.

```
topics {
  id
  subject_id
  topic_name
  syllabus_weight          → computed from JAMB past question frequency
  past_question_count      → raw JAMB frequency count, fixed at seed
  available_question_count → grows as questions are added to bank
  created_at
}
```

### Syllabus Weight Computation

Weight is derived from how frequently each topic appears in JAMB past questions:

```
1. Count past_question_count per topic per subject
2. Rank topics by count ascending
3. Bottom 5 topics → weight = 0.2 (low weight)
4. Remaining topics → scaled 0.4 to 1.0:

   weight = 0.4 + (0.6 × (topic_count - min_count) / (max_count - min_count))

Result:
  Lowest 5 topics          → 0.2
  Topics just above bottom → ~0.4
  Mid-range topics         → ~0.7
  Highest frequency topic  → 1.0
```

Weight recalculates only when new past JAMB questions are imported. It is a background admin job, not a runtime operation.

### Minimum Topic Count Per Simulation

```
40-question simulation → minimum 6 topics, maximum 9
60-question simulation → minimum 8 topics, maximum 12
```

Templates that do not meet minimum topic count are discarded during generation.

### Topic Combo Template Structure

```
subject_topic_templates {
  id
  subject_id
  topic_ids (array)
  combo_fingerprint          → sorted topic IDs joined as string
  total_topics
  weight_profile (JSON)      → syllabus weights of selected topics
  minimum_questions_covered  → sum of available_question_count across topics
  status                     → available | deprecated
  created_at
}

user_topic_template_history {
  user_id
  template_id
  session_id
  used_at
}
```

### Template Generation Logic

```
For each subject:
  1. Fetch all syllabus topics WHERE available_question_count ≥ 3
  2. Randomly select N topics within min-max range
     weighted by syllabus_weight
  3. Generate combo_fingerprint
  4. Check fingerprint not already in pool (no duplicates)
  5. Validate minimum_questions_covered can satisfy question demand
  6. Save to pool
  
Generate until pool reaches 100 templates per subject.
```

### Pool — 4 Subject Pools

```
Physics topic templates    → pool of 100
Chemistry topic templates  → pool of 100
Mathematics topic templates → pool of 100
English topic templates    → pool of 100

Refill threshold: 30% per subject pool, independently
```

### Topic Combo Fallback

If topic combo template cannot satisfy demand:

```
Level 1 → Redistribute shortfall to other topics in combo
Level 2 → Swap problematic topic for unused syllabus topic
          with better availability, reallocate that slot only
Level 3 → Pull next available topic template from pool
          mark current as used for this user
Level 4 → Dynamic runtime generation (Topic Engine)
          full weighted selection at runtime
          no template used, purely computed
```

Level 4 always exists as the final safety net.

---

## Engine 3 — Topic-Difficulty Allocation Engine

### Purpose

Bridges the difficulty blueprint (simulation template) and topic combo (topic template). Produces a fully resolved per-topic, per-difficulty question demand blueprint before any database fetch occurs.

### Signature

```typescript
allocateTopicDifficulty(
  difficultyBlueprint: SimulationTemplate,
  topicCombo: SubjectTopicTemplate,
  subjectId: number
) → TopicDifficultyBlueprint
```

### Step 1 — Resolve Question Count Per Topic

```
Base allocation = floor(questionCount / topicCount)
Remainder       = questionCount % topicCount
```

Distribute remainder by syllabus weight — higher weight topics absorb extra questions first.

Constraints:
```
Minimum per topic → 2 questions
Maximum per topic → 25% of total question count
                    (10 for 40q sessions / 15 for 60q sessions)
```

### Step 2 — Resolve Difficulty Breakdown Per Topic

For each topic, distribute difficulty slots proportionally by topic question count:

```
Topic share = topic_question_count / total_question_count

Per level demand for topic = topic_share × total_level_demand
```

Round to integers. Distribute rounding remainder to highest weight topics first.

### Step 3 — Resolve Rounding Errors

Sum each difficulty level across all topics. Compare against blueprint demand. Assign any shortfall to highest weight topic with room.

### Step 4 — Compute Point Budget Per Topic

```
topicPoints = sum(level × count) for all difficulty levels in topic
topicAverage = topicPoints / topicQuestionCount
```

Sum all topic points. Validate:
```
totalPoints / totalQuestions = sessionAverage
Must be inside 3.30 – 3.70
```

If outside tolerance after rounding resolution, shift one difficulty slot between topics until average lands inside range.

### Output

```typescript
TopicDifficultyBlueprint {
  subjectId: number
  totalQuestions: number
  totalPoints: number
  sessionAverage: number
  topics: [
    {
      topicId: number
      topicName: string
      questionCount: number
      syllabusWeight: number
      difficultyBreakdown: {
        level1: number
        level2: number
        level3: number
        level4: number
        level5: number
      }
      topicPoints: number
      topicAverage: number
    }
  ]
}
```

Runs once per subject independently. Four subjects → four blueprints → all fed into the Question Fetch pipelines together.

---

## Pipeline 1 — Question Retrieval Pipeline

### Purpose

Pure database retrieval. Fetches raw candidates per topic per difficulty slot. No scoring, no filtering, no logic.

### Input / Output

```typescript
retrieveCandidates(
  blueprint: TopicDifficultyBlueprint
) → RawCandidatePool
```

### Logic

For each topic in the blueprint, for each difficulty level with demand > 0:

```sql
SELECT id, subject_id, topic_id, difficulty, content, options
FROM questions
WHERE subject_id = $subjectId
AND topic_id = $topicId
AND difficulty = $level
```

Fetch with candidate multiplier:
```
demand = 2 questions
fetch  = 2 × 3 = 6 candidates
```

Multiplier gives the scoring pipeline enough candidates to work with before constraint resolution is needed.

---

## Pipeline 2 — Candidate Scoring Pipeline

### Purpose

Ranks every candidate question against the user's history. Makes no selection decisions — purely scores and sorts.

### Input / Output

```typescript
scoreCandidates(
  rawPool: RawCandidatePool,
  userId: string
) → ScoredCandidatePool
```

### User History Fetch

Load user's question history once into memory as a lookup map:

```sql
SELECT question_id, attempt_count, last_attempted, is_correct
FROM user_question_history
WHERE user_id = $userId
```

### Scoring Rules

```
Never seen                → score 100
Seen + wrong answer       → score 60  (deserves revisit)
Seen + long ago           → score 40
Seen + correct recently   → score 20
```

Candidates sorted by score descending per topic per difficulty slot. Top N required are selected in the next pipeline.

---

## Pipeline 3 — Constraint Resolution Pipeline

### Purpose

Satisfies blueprint demand using scored candidates. Handles all shortfalls. Maintains the running point budget throughout. The template distribution is a target — the tolerance range 3.30–3.70 is the only hard law.

### Input / Output

```typescript
resolveConstraints(
  scoredPool: ScoredCandidatePool,
  blueprint: TopicDifficultyBlueprint,
  pointBudget: PointBudget
) → ResolvedCandidatePool
```

### Point Budget

```
Initial budget     = template target points
                     e.g. 40 × 3.50 = 140 points
Tolerance floor    = 40 × 3.30 = 132 points
Tolerance ceiling  = 40 × 3.70 = 148 points
```

Every substitution debits or credits the budget. After every substitution:
```
current_points / total_questions = current_average
Must remain within 3.30 – 3.70
```

### Resolution Cascade

```
Level 1 — Select top scored candidates per slot
          Template distribution used as-is

Level 2 — Redistribute topic shortfall
          Take missing questions, spread to other selected topics
          Respect 25% max cap per topic

Level 3 — Adjacent difficulty substitution
          Same topic, Level ±1
          Track point delta per substitution

Level 4 — Topic replacement
          Drop underperforming topic
          Pull unused syllabus topic with better coverage
          Regenerate allocation for that slot only

Level 5 — Cross-subject compensation
          If one subject average drifts low,
          allow another subject to push slightly higher
          Global average across all subjects maintained

Level 6 — Full subject blueprint regeneration
          Regenerate Topic-Difficulty blueprint for failing subject only
          Re-run retrieval and scoring for that subject only
          Other subjects untouched

Level 7 — Full session retry
          Select next available templates from pool
          Restart entire pipeline
          Maximum 2 full retries

Level 8 — HARD STOP (see Failure Handling)
```

### Compensating Swaps

If budget approaches floor (average drifting below 3.30):
```
Find topic with Level 3 candidate that can swap up to Level 4
Check availability
Make upward swap
Recheck budget
```

If budget approaches ceiling (average drifting above 3.70):
```
Find topic with Level 4 candidate that can swap down to Level 3
Make downward swap
Recheck budget
```

---

## Pipeline 4 — Session Validation Pipeline

### Purpose

Final gate before session creation. Verifies all hard constraints are met. If any check fails, fires back to Constraint Resolution with the specific failure — not a full restart.

### Input / Output

```typescript
validateSession(
  resolvedPool: ResolvedCandidatePool,
  blueprint: TopicDifficultyBlueprint
) → ValidationReport
```

### Validation Checklist

```
✓ Exact question count per subject (60 / 40 / 40 / 40)
✓ Total session questions = 180
✓ No duplicate question IDs across entire session
✓ Global difficulty average inside 3.30 – 3.70
✓ Per subject average inside tolerance
✓ No topic exceeds 25% of subject question count
✓ Minimum topic count satisfied per subject
✓ Resolution count within healthy threshold
```

### Excessive Resolution Warning (Tier 1 Notification)

If resolution count exceeds threshold:
```
Per subject resolutions > 5    → flag that subject
Global resolutions > 12        → flag entire session
```

Session is still created and served normally. Admin is notified silently. No user impact.

```
simulation_notifications {
  type: 'excessive_resolution'
  session_id
  subjects_affected
  resolution_count
  admin_notified_at
}
```

---

## Failure Handling

### Distinguishing Failure Types

Before declaring hard stop, run raw availability check with no user history filter:

```
raw_available_questions > demand → Cause 2 (user exhaustion — milestone)
raw_available_questions < demand → Cause 1 (bank structurally thin — real error)
```

### Cause 2 — User Bank Exhaustion (Milestone)

User has practiced through the entire question bank for a subject. This is an achievement, not an error.

Progressive history filter relaxation:
```
Stage 1 → Exclude questions seen in last 7 days
Stage 2 → Exclude questions seen in last 3 days
Stage 3 → Exclude questions seen in last 24 hours
Stage 4 → Allow all questions, prioritize least recently seen
```

Surface the milestone to the user:
```
"You've practiced through our entire question bank for {subject}.
 This simulation pulls from questions you've seen before —
 a true test of mastery.
 
 🏆 Full Bank Milestone — {Subject}"
```

### Cause 1 — Hard Stop (Tier 2 Notification)

Only reached after all 7 resolution levels are exhausted with no valid session produced.

User receives:
```
"We couldn't generate your simulation at this time.
 Our team has been notified and will resolve this shortly.
 We apologize for the inconvenience."
```

Admin receives full diagnostic immediately:
```
CRITICAL: Simulation generation failed for user {name}

Subject combination: Physics / Chemistry / Mathematics / English
Resolutions attempted: all levels exhausted
Failing subjects: {subjects}
Primary gap: {level} critically undersupplied
Templates retried: 2
Full subject regenerations attempted: 1
Topic replacements attempted: 3
Cross-subject compensation attempted: yes — insufficient

User is awaiting response.
[ Send Compensation Message ]
```

### Notification Table

```
simulation_notifications {
  id
  user_id
  session_id              → null if generation failed
  type                    → 'excessive_resolution' | 'generation_failure'
  resolution_count
  subjects_affected (array)
  failure_detail (JSON)
  admin_notified_at
  admin_message_sent      → boolean
  admin_message_content
  resolved_at
}
```

---

## Engine 4 — CBT Session Engine

### Purpose

Creates and stores the examination session after the candidate pool is validated. Returns the session to the frontend.

### Signature

```typescript
createCBTSession(
  userId: string,
  resolvedPool: ResolvedCandidatePool,
  validationReport: ValidationReport,
  templateIds: number[],
  topicTemplateIds: number[],
  subjectCombo: number[]
) → CBTSession
```

### Step 1 — Create Session Record

Single atomic write:

```
exam_sessions {
  id
  user_id
  status                  → 'pending'
  subject_combo (array)
  difficulty_template_ids (array)
  topic_template_ids (array)
  total_questions         → 180
  duration_seconds        → 6480 (108 minutes)
  started_at              → null (set when user taps Start)
  expires_at              → null (set when user taps Start)
  submitted_at            → null
  terminated_at           → null
  score                   → null
  resolution_count
  validation_report (JSON)
  created_at
}
```

### Session Status Flow

```
'pending'     → session created, pre-exam warning screen showing
'active'      → user tapped Start, timer running
'terminated'  → reload/close detected via missed heartbeats
'expired'     → expires_at passed, auto-submitted
'submitted'   → user submitted manually
'scored'      → submission engine finished computing
```

### Step 2 — Store Session Questions

```
exam_session_questions {
  id
  session_id
  question_id
  subject_id
  topic_id
  difficulty
  position
  selected_answer         → null, filled during exam
  is_correct              → null, filled on submission
  time_spent              → null, filled on submission
}
```

Position assignment:
```
English     → positions 1–60
Subject 2   → positions 61–100
Subject 3   → positions 101–140
Subject 4   → positions 141–180
```

### Step 3 — Atomic Template History Write

Both template history tables written atomically with session creation:

```
user_template_history (difficulty templates)
user_topic_template_history (topic combo templates)
user_session_topics (fingerprints for future uniqueness)
```

If session creation fails, no history records are written. No orphaned consumption.

### Step 4 — Async Refill Check

After session creation, non-blocking check:
```
difficulty templates < 30% → trigger refill
topic templates per subject < 30% → trigger refill
```

User never waits for this.

### Session Response

Only what the frontend needs:

```typescript
CBTSession {
  sessionId: string
  userId: string
  duration: number          → seconds
  subjects: [
    {
      subjectId: number
      subjectName: string
      questionCount: number
      questions: [
        {
          position: number
          questionId: string
          content: object
          options: string[]
        }
      ]
    }
  ]
}
```

No difficulty levels, topic IDs, or internal metadata exposed to frontend.

### One Active Session Rule

Before creating a new session, check for existing active session:

```sql
SELECT * FROM exam_sessions
WHERE user_id = $userId
AND status = 'active'
AND expires_at > now()
LIMIT 1
```

If found → return 409 conflict. User must complete or terminate existing session first.

---

## CBT Exam Integrity

### Pre-Exam Warning Screen

Displayed before the user can start. Requires active acknowledgement:

```
⚠️ Simulation Rules — Read Carefully

This is a JAMB-standard simulation. The following rules apply:

• You have 108 minutes from the moment you start
• Closing, reloading, or leaving this page will immediately
  terminate your session
• Terminated sessions are auto-submitted with answers
  saved up to that point
• Unanswered questions score zero
• Network loss during the exam will terminate your session
• Ensure you have a stable connection before starting
• There are no exceptions or reversals

This mirrors real JAMB CBT conditions.

[ I Understand — Begin Simulation ]
```

Session status moves from `pending` → `active` only when this button is tapped.

### No Reload Tolerance

Closing, reloading, or navigating away terminates the session immediately. This mirrors real JAMB CBT hall conditions. The exam carries real stakes.

### Heartbeat System

Frontend sends heartbeat every 30 seconds:
```
POST /api/simulation/session/:id/heartbeat
```

Any user interaction also resets the heartbeat timer:
```
Answer selection
Option tap
Question navigation
Any button press
```

### Three Strike Termination

Server tracks consecutive missed heartbeats:

```
exam_sessions {
  last_heartbeat_at
  missed_heartbeats     → resets to 0 on any heartbeat received
}
```

```
Strike 1 (30s no heartbeat)  → warn client, no action
Strike 2 (60s no heartbeat)  → warn client again, no action
Strike 3 (90s no heartbeat)  → terminate, auto-submit
```

Strikes must be consecutive. Any heartbeat resets the count to 0.

### Client-Side Warning (Strikes 1 and 2)

Server returns warning flag in heartbeat response:

```json
{
  "status": "warning",
  "missed": 1,
  "message": "Connection issue detected"
}
```

Frontend displays non-blocking banner:

```
⚠️ Connection issue detected
   Your session will be terminated in 5 seconds
   if connection is not restored.

   [ I'm Still Here ]
```

Tapping the button sends an immediate heartbeat, resets missed count to 0, dismisses the banner.

### Network Loss

If internet is fully cut off:
```
Client cannot send heartbeat
Client cannot receive warning
Server strikes out at 90 seconds
Session terminates silently
Results shown from whatever was saved when connection returns
```

This is a declared condition covered by the pre-exam warning. No further mitigation.

### Answer Buffering During Exam

Lightweight endpoint — single row update per answer:

```
PATCH /api/simulation/session/:id/answer

Body: {
  questionId: string
  selectedAnswer: string
  timeSpent: number
}
```

If session is terminated before submission, whatever answers exist server-side are used for scoring. No answer data is lost.

### Session Expiry

Background job polls for expired active sessions:
```
exam_sessions WHERE status = 'active' AND expires_at < now()
→ status = 'expired'
→ auto-submit with existing answers
→ unanswered questions marked null
→ pass to Submission Engine
```

---

## Database Schema Summary

```
simulation_templates
user_template_history
subject_topic_templates
user_topic_template_history
user_session_topics
exam_sessions
exam_session_questions
user_question_history
simulation_notifications
topics (seeded from JAMB syllabus)
```

---

## Separation of Responsibilities

```
Simulation Template Engine       → statistical difficulty blueprint
Subject Topic Template Engine    → syllabus-grounded topic combinations
Topic-Difficulty Allocation Engine → bridges both templates into unified blueprint
Question Retrieval Pipeline      → pure database fetch, no logic
Candidate Scoring Pipeline       → ranks candidates against user history
Constraint Resolution Pipeline   → satisfies demand, maintains point budget
Session Validation Pipeline      → final integrity gate
CBT Session Engine               → creates session, manages exam lifecycle
```

---

## Still To Design

```
→ Submission Engine
→ History Update Engine
→ NBA (Next Best Action) Engine — designed separately, deferred
```

---

*ExamLogic Architecture Document — Version 1.0*
*Designed for JAMB CBT simulation pipeline*
*Pending: Submission Engine, History Update Engine*
