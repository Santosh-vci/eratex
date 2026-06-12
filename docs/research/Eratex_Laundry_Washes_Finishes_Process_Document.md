# Eratex Laundry Washes, Finishes, Effects, and Process Document

**Company context:** PT Eratex Djaja Tbk  
**Document purpose:** Research and process reference for denim/chino laundry, washing, finishing, effects, and scheduling implications  
**Created:** 2026-06-11  
**Primary source boundary:** Official Eratex website, Eratex annual/sustainability reports, Eratex solution-deck synthesis, and generic denim laundry process knowledge

---

## 1. Executive Summary

Eratex is a bottoms-focused garment manufacturer with a high denim share. The public Eratex website describes the company as producing five-pocket jeans, casual pants, denim, and twill products, with in-house washing and finishing facilities supporting sewing capacity. The website explicitly claims capability across known washing types from basic stone bleach to garment dye development, plus manual processes such as sand blasting, scraping, and whiskering.

The 2025 annual and sustainability reports extend this picture. They show that Eratex has continued to invest in laundry operations, including new washers, compact laser machines, front-loading machines, hydro extractors, conveyor dryers, boiler changes, wastewater treatment, water-saving washing methods, wastewater reuse, chemical inventory tools, ZDHC wastewater testing, and EIM subscription. The reports also describe sustainable wash capability development and strengthening of laundry teams for complex wash handling.

For the Eratex planning and scheduling platform, laundry should not be treated as a simple end-of-line finishing step. Denim and chino laundry is a routing, capacity, quality, sustainability, and shipment-risk domain. A proper system model must support wash route definitions, machine group constraints, dry process operations, wet process operations, recipe/version control, shade-lot batching, post-wash QC, rewash loops, and release to finishing.

---

## 2. Source Boundary

### 2.1 Official Eratex Public Claims

The following points are directly grounded in Eratex website/report material:

| Area | Public Eratex information |
|---|---|
| Product focus | Casual bottom wear, including classic five-pocket jeans and casual pants. |
| Fabric/product mix | Denim forms a majority share of pants capacity; the website states approximately 65% denim and 35% chino, while the 2025 annual/sustainability reports refer to more than 60% denim. |
| Sewing scale | Website states 1,660 sewing machines in 2 shifts per day and annual sewing capacity of 11 million garments. |
| Laundry support | Website states compatible washing and finishing facilities are in place to support sewing capacity. |
| In-house washing | Website says in-house washing is an attraction to customers. |
| Wash range | Website says Eratex can handle known washings from basic stone bleach to garment dye development with customers. |
| Manual effects | Website says sand blasting, scraping, and whiskering are available. |
| Garment operations | Website shows laundry washing machines and laundry drying machines as part of garment operations. |
| 2025 operations | 2025 annual report mentions addition/replacement of laundry machines, sustainable washes capability, 10 new washers, 10 compact laser machines, laundry automation, and state-of-the-art wastewater treatment plant. |
| Sustainability controls | Sustainability reports mention water-saving washing methods, wastewater reuse for garment washing, ZDHC wastewater testing, chemical inventory tools, EIM subscription, and investment in front-loading machines, hydro extractors, laser machines, Tonello machines, and conveyor dryers. |

### 2.2 Local Eratex Planning Deck Context

The Eratex solution-deck synthesis identifies laundry as a major planning constraint. It calls out wet process, acid wash, moon wash, laser dry process, and manual dry process as laundry categories. It also identifies machine or sub-resource groupings such as Tonello 125 kg, Tonello 150 kg, Brongo, Yilmax, Tolkar, Ramson, PP Spray Booth, Mannequin, Vaportech, laser machines, and other laundry resources.

This local deck context is not the same as a public website claim, but it is relevant for scheduling-tool design because it shows the level of process and machine specificity expected in planning.

### 2.3 Generic Denim Laundry Knowledge

The broader process descriptions in this document use standard denim and garment laundry knowledge. These should be validated against Eratex's actual wash recipe masters, buyer manuals, machine manuals, chemical supplier data sheets, ZDHC requirements, and internal quality standards before being implemented.

---

## 3. What Eratex Appears To Be Capable Of Publicly

Based on official public material, Eratex's laundry capability can be summarized as:

| Capability family | Evidence basis | Practical meaning |
|---|---|---|
| Denim bottoms washing | Public product mix and in-house washing claim | Wash process is central to the product value proposition, not optional support. |
| Basic stone bleach | Explicit website claim | Eratex publicly positions itself as capable of abrasion/fading and bleach-based wash effects. |
| Garment dye development | Explicit website claim | Eratex can support customer development where garment-level dyeing or over-dye/tint development is needed. |
| Manual dry effects | Website lists sand blasting, scraping, whiskering | Eratex has or has had manual effect capability, subject to current buyer and safety restrictions. |
| Laser dry effects | Annual/sustainability reports mention compact laser machines | Laser can replace or reduce manual abrasion/spray work for repeatable dry-process effects. |
| Washing and drying machinery | Garment operations page and reports | Laundry is equipped with washing and drying assets, not purely outsourced. |
| Front-loading machine modernization | Sustainability reports | Supports lower water/chemical/energy intensity versus older belly-machine setups. |
| Hydro extraction | Sustainability reports | Removes water before drying, reducing dryer load and energy use. |
| Wastewater treatment and reuse | Sustainability reports | Laundry has environmental controls and reuse logic that affect process design. |
| Chemical governance | Sustainability reports and ZDHC references | Chemical selection, storage, wastewater testing, and MRSL compliance matter in recipe governance. |

---

## 4. Laundry Process Architecture

Laundry should be modeled as a controlled production flow:

```text
Sewn goods availability
-> Pre-wash QC and shade-lot grouping
-> Wash route and recipe confirmation
-> Batch creation
-> Dry process, if required
-> Wet process
-> Hydro extraction
-> Drying / curing / tumble
-> Post-wash QC
-> Rewash / touch-up, if required
-> Release to finishing
-> Finishing, pressing, packing readiness
```

Each stage has its own capacity, queue, machine group, quality risk, and rework possibility.

---

## 5. Wash Route Families

### 5.1 Rinse Wash / One Wash

**Intent:** Clean the garment, remove loose dye or impurities, improve hand feel, and stabilize the garment without heavy fading.

**Typical use cases:**

- Dark denim requiring minimal fading.
- Chinos or twill bottoms where the buyer wants a clean garment-wash finish.
- Pre-softening before finishing.

**Typical process logic:**

```text
Load garments
-> Rinse or mild detergent wash
-> Optional desizing
-> Softener
-> Hydro extraction
-> Drying
-> QC
```

**Key controls:**

- Shade retention.
- Shrinkage.
- Hand feel.
- Water temperature.
- Load ratio and liquor ratio.
- Drying temperature.

### 5.2 Desize Wash

**Intent:** Remove sizing materials from denim fabric so downstream abrasion, enzyme, bleach, dye, or softener steps work consistently.

**Typical process logic:**

```text
Desizing agent / enzyme
-> Time and temperature control
-> Rinse
-> Neutralization if needed
```

**Scheduling relevance:** Often a hidden first wet-process step. If not modeled, cycle time and machine occupancy will be understated.

### 5.3 Stone Wash

**Intent:** Create a worn, faded, softer denim appearance through mechanical abrasion, traditionally using pumice or alternative abrasion media.

**Effect outcome:**

- Washed-down color.
- High-low seam contrast.
- Softer hand feel.
- More vintage appearance.

**Typical process logic:**

```text
Desize, if needed
-> Load denim and stones/abrasion media
-> Tumble for defined time
-> Remove stones/debris
-> Rinse
-> Optional enzyme/bleach/softener
-> Dry
```

**Key controls:**

- Stone/media type and quantity.
- Time, RPM, load ratio, water level.
- Seam abrasion.
- Tear strength.
- Pocket/belt-loop damage.
- Back-staining and shade variation.

**Eratex relevance:** The website explicitly refers to basic stone bleach capability.

### 5.4 Enzyme Wash / Bio-Stone Wash

**Intent:** Use cellulase enzymes to create a softer, worn, faded effect with more controlled abrasion than heavy pumice stone usage.

**Effect outcome:**

- Softer hand feel.
- Moderate fading.
- Surface fiber cleanup.
- Less harsh mechanical damage than heavy stone wash when properly controlled.

**Typical process logic:**

```text
Desize
-> Enzyme treatment at controlled pH and temperature
-> Mechanical agitation
-> Enzyme deactivation / neutralization
-> Rinse
-> Softener
-> Dry
```

**Key controls:**

- Enzyme type: acid cellulase, neutral cellulase, or specialty enzyme.
- pH.
- Temperature.
- Time.
- Garment load.
- Anti-backstain agent.
- Deactivation completeness.

**Planning relevance:** Enzyme wash may have different cycle time, chemical setup, and quality risk than stone wash, even if the visual output looks similar.

### 5.5 Stone-Enzyme Combination

**Intent:** Combine mechanical abrasion and enzyme action to achieve a stronger worn look than enzyme alone, with less stone usage than traditional stone wash.

**Typical process logic:**

```text
Desize
-> Stone + enzyme or staged stone/enzyme process
-> Rinse and remove residue
-> Neutralize / deactivate
-> Softener
-> Dry
```

**Key controls:**

- Stone/media ratio.
- Enzyme dosage.
- Garment damage.
- Back-staining.
- Batch-to-batch consistency.

### 5.6 Bleach Wash

**Intent:** Reduce indigo shade intensity and create lighter denim shades.

**Common chemistry patterns:**

- Hypochlorite bleach, where allowed by buyer and regulation.
- Peroxide bleach in some processes.
- Specialty reducing/oxidizing systems depending on target shade and compliance.

**Typical process logic:**

```text
Desize/rinse
-> Controlled bleach step
-> Shade check
-> Neutralization
-> Multiple rinses
-> Softener
-> Dry
```

**Key controls:**

- Chemical dosage.
- pH.
- Time and temperature.
- Neutralization completeness.
- Strength loss.
- Shade reproducibility.
- Effluent load.

**Eratex relevance:** Public website mentions basic stone bleach.

### 5.7 Acid Wash / Snow Wash / Moon Wash

**Intent:** Produce high-contrast, irregular, mottled, or moon-like fading patterns. In many factories, this may involve chemical treatment of stones/balls/media, spray methods, or controlled local oxidation. The exact process depends on buyer approval and compliance rules.

**Effect outcome:**

- Cloudy, frosted, mottled, moon, or snow-like effect.
- High contrast between ground shade and abraded areas.

**Typical process logic:**

```text
Pre-wash or desize
-> Apply controlled chemical/abrasive medium or local spray
-> Tumble or hold as per recipe
-> Neutralize completely
-> Rinse
-> Softener
-> Dry
```

**Key controls:**

- Safety and PPE.
- Chemical containment.
- Neutralization.
- Repeatability.
- Garment strength.
- Buyer restrictions.

**Eratex planning-deck relevance:** Acid wash and moon wash are identified as laundry categories in the local solution-deck synthesis.

### 5.8 Ozone Wash

**Intent:** Use ozone to reduce indigo shade or clean/treat denim with lower water usage than some conventional wet processes.

**Effect outcome:**

- Bleach-like fading or shade reduction.
- Potentially lower water and chemical load if process is designed well.

**Typical process logic:**

```text
Load garments, often after controlled moisture setting
-> Ozone exposure
-> Ozone destruct / safety clearance
-> Rinse or neutral step if required
-> Softener/dry
```

**Key controls:**

- Moisture content.
- Ozone exposure time.
- Chamber safety interlocks.
- Shade target.
- Uniformity.

**Eratex source boundary:** The public Eratex website does not explicitly claim ozone. This is generic denim laundry context and should be validated against Eratex's machine list and buyer-approved process list.

### 5.9 Garment Dye / Overdye / Tint Development

**Intent:** Add or modify garment color after sewing. This may be used for fashion color, vintage tone, over-dye denim looks, chino color development, or shade correction.

**Typical process logic:**

```text
Scour/desize if needed
-> Dye bath or tint bath
-> Fixation
-> Washing off
-> Softener
-> Dry
-> Shade QC
```

**Key controls:**

- Dye class and fabric composition.
- Shade standard.
- Lab-to-bulk correlation.
- Batch size.
- Temperature curve.
- Salt/alkali/fixation chemistry if applicable.
- Colorfastness.
- Effluent.

**Eratex relevance:** Website explicitly states garment dye development with customers.

### 5.10 Tinting / Top Tint / Local Tint

**Intent:** Apply a cast or tone to the garment after base washing, such as grey cast, brown cast, vintage cast, dirty tint, green cast, or local highlight.

**Typical process logic:**

```text
Base wash
-> Tint bath or local application
-> Fixation if needed
-> Rinse
-> Softener
-> Dry
```

**Key controls:**

- Shade consistency.
- Shade lot separation.
- Rubbing fastness.
- Buyer approval.
- Reproducibility.

### 5.11 Softener / Hand-Feel Finish

**Intent:** Improve garment touch, drape, comfort, and perceived quality.

**Typical process logic:**

```text
Final rinse
-> Softener or silicone finish
-> Hydro extraction
-> Tumble dry
```

**Key controls:**

- Softener type.
- Dosage.
- Yellowing risk.
- Residual chemical feel.
- Absorbency or repellency impact.
- Buyer restricted substances.

### 5.12 Chino / Twill Garment Wash

**Intent:** Stabilize, soften, and give a clean garment-washed look to non-denim bottoms.

**Typical process logic:**

```text
Garment wash
-> Optional enzyme
-> Optional tint / over-dye
-> Softener
-> Drying
-> Pressing
```

**Key controls:**

- Crease marks.
- Shade migration.
- Seam puckering.
- Measurement shrinkage.
- Pressing and finishing sensitivity.

---

## 6. Dry Process and Manual Effect Families

Dry processes are often performed before wet wash, but the exact sequence depends on the desired visual effect.

### 6.1 Whiskering

**Intent:** Create crease/fade lines around the front crotch, thigh, knee, or back-knee areas to mimic natural wear.

**Methods:**

- Manual whiskering with sandpaper or tools.
- Template-based whiskering.
- Laser whiskering.

**Eratex relevance:** Website explicitly lists whiskering.

### 6.2 Hand Scraping

**Intent:** Create localized worn-down areas on thighs, seat, pocket edges, knees, and seams.

**Methods:**

- Sandpaper.
- Abrasive tools.
- Laser substitute.

**Eratex relevance:** Website says "scrapping"; operationally this is usually referred to as scraping.

### 6.3 Sand Blasting

**Intent:** Create faded areas using abrasive blasting.

**Important control point:** Many brands restrict or prohibit sandblasting because of worker health risks, especially respirable silica exposure. Even though the Eratex website lists sand blasting, any current use must be validated against buyer compliance, local regulation, PPE, containment, and current Eratex policy. Modern alternatives include laser, hand scraping, and safer controlled abrasion methods.

### 6.4 Grinding

**Intent:** Abrade hems, pocket edges, waistbands, belt loops, or seam edges for a worn look.

**Key controls:**

- Abrasion depth.
- Thread damage.
- Button/rivet damage.
- Consistent placement.

### 6.5 Destroy / Rip / Repair

**Intent:** Create holes, rips, frays, patches, or repaired vintage effects.

**Key controls:**

- Pattern location.
- Garment strength after damage.
- Sewing reinforcement.
- Buyer tolerance.
- Safety during wash and dry tumbling.

### 6.6 PP Spray / Local Bleach Spray

**Intent:** Create local brightening, thigh fading, moustache enhancement, or panel highlights.

**Common chemistry:** Potassium permanganate or other local oxidation chemistry, subject to buyer and chemical compliance.

**Key controls:**

- Spray booth capacity.
- PPE and ventilation.
- Neutralization.
- Spot reproducibility.
- Worker exposure.

**Eratex planning-deck relevance:** PP Spray Booth appears as a laundry sub-resource category in the local solution-deck synthesis.

### 6.7 Laser Dry Process

**Intent:** Use laser marking to create whiskers, abrasion, local fading, texturing, logos, and repeatable patterns.

**Advantages:**

- Repeatable effect files.
- Reduced manual variability.
- Potential reduction in water, chemical, and manual abrasion.
- Easier style-to-style digital standardization.

**Key controls:**

- Laser file version.
- Fabric shade and coating response.
- Power/speed settings.
- Garment positioning.
- Ventilation and fume extraction.
- Correlation between laser look and final post-wash appearance.

**Eratex relevance:** Public reports mention compact laser machines and sustainability-related laser investment.

### 6.8 3D Resin / Wrinkle / Crinkle Effects

**Intent:** Create permanent or semi-permanent creases, crinkles, baked wrinkles, or dimensional effects.

**Typical process logic:**

```text
Apply resin
-> Shape on mannequin/form
-> Cure/bake
-> Wash or final finish
```

**Key controls:**

- Resin chemistry.
- Formaldehyde or restricted substances.
- Cure temperature/time.
- Hand feel.
- Durability.

**Eratex source boundary:** Generic denim laundry context. Validate whether this is currently part of Eratex's approved capability list.

---

## 7. Wet Process Families and Effects Matrix

| Process | Main visual/functional effect | Major risks | Planning impact |
|---|---|---|---|
| Rinse / one wash | Clean, stable, dark look | Shade variation, shrinkage | Shorter route, lower complexity |
| Desize | Prepares garment for effect steps | Incomplete desize, uneven effect | Hidden first step, affects downstream quality |
| Stone wash | Vintage abrasion and fade | Strength loss, damage, residue | Longer drum time, media handling |
| Enzyme wash | Softness, bio-stone fade | Back-staining, over-fading | pH/temp/time critical; recipe-specific |
| Stone-enzyme | Stronger worn look | Damage, shade inconsistency | Higher quality risk and cycle time |
| Bleach wash | Light shade | Strength loss, neutralization failure | Effluent and compliance controls |
| Acid / snow / moon wash | High contrast, mottled look | Chemical safety, reproducibility | Specialized route/machine/booth constraints |
| Ozone | Shade reduction, lower-water effect | Uniformity, chamber safety | Specialized machine and moisture control |
| Garment dye | Color development | Shade lot variation, fastness | Dye batch discipline and lab approval |
| Tinting | Cast or vintage tone | Rubbing fastness, shade drift | Often post-base-wash; can drive rework |
| Softener | Hand feel | Yellowing, over-softening | Often final wet step |
| Hydro extraction | Water removal | Crease marks, imbalance | Reduces dryer load; separate capacity if constrained |
| Drying | Moisture removal, hand feel | Overdrying, shrinkage, energy use | Dryer bottleneck can delay shipment |

---

## 8. Typical End-To-End Recipe Structure

A denim wash recipe should be more than a name. At minimum, the system should capture:

| Recipe field | Why it matters |
|---|---|
| Buyer / customer | Different buyers have different restricted substances, effect tolerances, and reporting requirements. |
| Style / color / wash code | Wash standards are style-specific. |
| Fabric composition | Cotton, stretch, blends, weight, sulfur/indigo status affect recipe behavior. |
| Route version | Approved routes must be version-controlled. |
| Dry process steps | Laser, whisker, scrape, destroy, PP spray, grinding, etc. |
| Wet process steps | Desize, enzyme, stone, bleach, tint, softener, etc. |
| Machine group | Not every wash can run on every machine. |
| Standard batch size | Impacts capacity, quality, and cost. |
| Standard cycle time | Required for scheduling and capacity planning. |
| Chemical family | Enables compliance and inventory checks. |
| pH, temperature, time | Core process control parameters. |
| Load ratio / liquor ratio | Drives water, chemical, effect, and mechanical action. |
| Neutralization requirement | Critical for bleach/PP/oxidation chemistry. |
| Hydro/dry parameters | Impacts shrinkage, hand feel, energy, and throughput. |
| QC standards | Shade, hand feel, shrinkage, appearance, rubbing fastness, tear strength. |
| Rewash allowance | Defines whether and how repeat cycles are allowed. |
| Sustainability score | Can reference EIM or internal water/energy/chemical metrics. |

---

## 9. Machine and Workcenter View

The scheduling tool should not treat laundry as one capacity bucket. It should model process-specific resources.

### 9.1 Machine/Resource Classes

| Resource class | Example use |
|---|---|
| Washing machine / wet process washer | Rinse, enzyme, stone, bleach, garment dye, softener |
| Front-loading washer | Lower-water and controlled wash processes |
| Belly washer / older washer | Legacy wet process capacity where still used |
| Tonello machine | Wet process or sustainable wash routes, depending on installed model |
| Brongo / Yilmax / Tolkar / Ramson | Machine-group categories from local deck context |
| Hydro extractor | Water removal before drying |
| Tumble dryer / conveyor dryer | Drying and hand feel development |
| Laser machine | Whisker, abrasion, pattern, local fade |
| PP spray booth | Local chemical spray effects |
| Mannequin / form | 3D wrinkle/resin effect |
| Vaportech / ozone / specialty machine | Specialty sustainable or dry/wet technology, where applicable |
| QC table / shade booth | Post-wash approval and sorting |

### 9.2 Why Machine Specificity Matters

The same garment quantity may consume very different capacity depending on:

- Wash route.
- Machine group.
- Batch size.
- Customer-machine preference.
- Required dry process.
- Number of wash cycles.
- Rewash probability.
- Dryer capacity.
- Shade-lot separation.
- Chemical/recipe changeover.

For scheduling, this means laundry load should be calculated using route and machine-specific minutes, not only garment quantity.

---

## 10. Batch Creation and Shade-Lot Logic

Laundry batching should consider:

- Order number.
- Style.
- Color/wash code.
- Shade lot.
- Fabric lot.
- Size mix if relevant.
- Buyer.
- Wash route.
- Dry process requirement.
- Machine compatibility.
- Minimum and maximum machine load.
- Shipment priority.
- Rewash risk.

### 10.1 Batch Rules

| Rule | Reason |
|---|---|
| Do not mix different wash routes unless formally approved. | Prevent effect mismatch. |
| Do not mix shade lots unless allowed. | Prevent shade variation. |
| Do not overload machine beyond approved range. | Avoid uneven wash and quality failure. |
| Avoid underloading unless shipment priority justifies exception. | Protect efficiency and sustainability metrics. |
| Preserve parent batch reference during rewash. | Maintain traceability. |
| Keep dry process status visible before wet process. | Avoid sending incomplete effect garments to wash. |

---

## 11. Quality Controls

### 11.1 Pre-Wash Controls

- Sewn quantity confirmation.
- Style/wash code confirmation.
- Trim and label wash suitability.
- Metal accessory suitability.
- Shade lot and fabric lot validation.
- Pre-wash measurement baseline.
- Dry process completion status.
- Garment damage check before wash.

### 11.2 In-Process Controls

- Machine program.
- Batch quantity.
- Recipe step status.
- Chemical dosage.
- Temperature.
- pH.
- Time.
- Water level or liquor ratio.
- Ozone/laser/spray settings where applicable.
- Operator and supervisor sign-off.

### 11.3 Post-Wash Controls

- Shade against approved standard.
- Hand feel.
- Wash effect placement.
- Whisker/scrape/laser alignment.
- Measurement after wash.
- Twisting/skewing.
- Seam puckering.
- Rubbing fastness.
- Colorfastness.
- Tear/tensile strength if buyer requires.
- Stains, holes, chemical spots, streaks.
- Trim damage.
- Label and print condition.

### 11.4 Rewash and Touch-Up Controls

Rewash should not be a casual production decision. It consumes capacity and can affect shipment.

Required rewash data:

- Rewash reason.
- Quantity.
- Parent batch.
- Root batch.
- Rewash route.
- Approver.
- Expected effect correction.
- Additional capacity consumption.
- Shipment impact.
- Maximum repeat cycles.

---

## 12. Sustainability and Compliance Controls

Laundry is one of the highest-impact areas in a denim plant because it uses water, steam/energy, chemicals, dyes, abrasion, drying, and wastewater treatment.

### 12.1 Eratex Public Sustainability Signals

Official reports indicate:

- Development of water-saving washing methods.
- Reuse of wastewater for garment washing.
- Reduction in water-use intensity in 2025 compared with 2024.
- Front-loading washing machines.
- Hydro extractors.
- Laser machines.
- Tonello front-loading machines for production and sampling.
- Conveyor dryer investment.
- Wastewater treatment plant.
- ZDHC wastewater testing.
- Chemical inventory tools.
- EIM subscription.
- Movement away from coal boilers to gas/biomass/renewable energy arrangements.

### 12.2 Generic Controls Required In Denim Laundry

| Control area | Practical requirement |
|---|---|
| Chemical input | Use approved chemicals and maintain MRSL compliance. |
| Chemical storage | Segregated, labelled, controlled, and traceable. |
| Worker safety | PPE, ventilation, training, emergency response, exposure control. |
| Spray/oxidation process | Booth extraction, neutralization, spill control, operator protection. |
| Wastewater | Treatment, testing, reporting, sludge handling, ZDHC or buyer standards where required. |
| Water reuse | Control recycled water quality so it does not cause shade or contamination issues. |
| Energy | Track steam, electricity, dryer load, boiler fuel, and machine utilization. |
| Restricted process | Validate sandblasting, PP spray, chlorine, formaldehyde resin, and other high-risk processes against buyer policy. |

---

## 13. Scheduling and Planning Implications

Laundry should be a first-class constraint in Eratex planning.

### 13.1 Why Laundry Can Break A Good Sewing Plan

A sewing plan can appear feasible while laundry is overloaded. This can happen when:

- Many orders need the same wash type.
- Heavy-wash denim clusters in the same week.
- Laser or PP spray capacity is limited.
- Drying capacity is lower than wet-wash capacity.
- Customer-specific machines are required.
- Rewash consumes hidden capacity.
- Shade-lot batching creates small inefficient batches.
- Wet process completion is delayed by dry process backlog.
- Machine breakdown or chemical shortage interrupts route execution.

### 13.2 Capacity Calculation Logic

Laundry capacity should be calculated at the route-step level:

```text
Batch load minutes =
  dry process minutes
+ wet process machine minutes
+ hydro extraction minutes
+ drying minutes
+ QC handling minutes
+ expected rewash minutes
+ setup/changeover minutes
```

Machine availability should consider:

```text
available machine minutes =
  working hours
x shift pattern
x machine count
x efficiency factor
- maintenance
- planned downtime
- cleaning/changeover
```

### 13.3 Priority Logic

Laundry batch priority should combine:

- Shipment due date.
- Ex-factory risk.
- Current buffer penetration.
- Buyer priority.
- Wash route criticality.
- Dry process readiness.
- Machine setup continuity.
- Batch efficiency.
- Rewash risk.
- Downstream finishing and packing capacity.

### 13.4 Sequencing Logic

Good sequencing should:

- Group compatible wash routes where possible.
- Respect shade-lot restrictions.
- Avoid mixing high-risk colors/effects.
- Protect urgent shipment batches.
- Reduce unnecessary machine changeovers.
- Keep dryers fed but not overloaded.
- Reserve capacity for rewash and urgent recovery.
- Avoid creating wet WIP without downstream drying/QC capacity.

---

## 14. Recommended Data Model For The Scheduling Tool

### 14.1 Master Data

| Master | Key fields |
|---|---|
| Wash route master | Route code, buyer, style family, wash family, route version, active/approved status |
| Wash route steps | Step sequence, step type, machine group, standard time, standard batch size |
| Recipe master | Recipe code, chemical families, process parameters, approval status |
| Machine master | Machine code, machine group, capacity, supported wash types, status |
| Dry process master | Laser, whisker, scrape, grinding, PP spray, destroy, 3D process |
| QC standard master | Shade, hand feel, appearance, measurement, fastness, strength |
| Sustainability controls | Water/energy/chemical score, EIM reference, ZDHC/MRSL flags |
| Buyer restrictions | Prohibited processes, allowed chemicals, compliance documents |

### 14.2 Transaction Data

| Transaction | Key fields |
|---|---|
| Wash batch | Batch number, order, style, route, shade lot, quantity, machine, status |
| Wash event | Step start, step complete, hold, release, rewash required, QC passed |
| Rewash batch | Parent batch, root batch, reason, quantity, route, approver |
| Dry process event | Process type, operator, file/template, quantity, status |
| QC result | Shade, effect, measurement, hand feel, defects, pass/fail, action |
| Machine downtime | Machine, reason, start/end, impact |
| Recipe deviation | Parameter, approved value, actual value, reason, approver |

---

## 15. Functional Requirements For A Laundry Module

### 15.1 Route and Recipe Control

- Approved wash route must exist before production planning.
- Approved route should not be edited directly; create a new version.
- Route must define dry process, wet process, hydro, drying, QC, and rewash allowance.
- Recipe should capture enough parameters to support repeatability and audit.

### 15.2 Planning Board

The planning board should show:

- Waiting for wash.
- Waiting dry process.
- Dry process WIP.
- Waiting wet wash.
- Wet wash in process.
- Waiting drying.
- Drying in process.
- Waiting post-wash QC.
- Rewash/touch-up.
- Released to finishing.

### 15.3 Execution Capture

Operators or supervisors should capture:

- Batch start.
- Step completion.
- Machine used.
- Quantity processed.
- Hold reason.
- QC result.
- Rewash requirement.
- Release to finishing.

### 15.4 Alerts

Alerts should be created for:

- Wash route missing.
- Machine incompatible with route.
- Batch underload/overload.
- Dry process not complete.
- Wet wash delayed.
- Dryer bottleneck.
- Post-wash QC pending.
- Rewash required.
- Machine breakdown.
- Shipment risk caused by wash delay.

---

## 16. Process-to-System Crosswalk

| Laundry process reality | System capability needed |
|---|---|
| Same order may require dry and wet processes | Route steps with dry/wet distinction |
| Same wash name can have different recipes by buyer/style | Recipe versioning |
| Same machine cannot run all wash types | Machine compatibility matrix |
| Denim shade lots cannot always mix | Shade-lot aware batching |
| Heavy fashion wash has high rework risk | Expected rewash load and exception priority |
| Laser effects depend on approved files/settings | Laser file/version reference |
| PP spray and bleach need safety controls | Restricted-process governance |
| Rewash consumes real capacity | Child batch and capacity recalculation |
| Drying can be bottleneck | Dryer capacity as separate constraint |
| QC may block finishing | Post-wash QC gate before release |
| Sustainable wash is a customer value proposition | Water/energy/chemical metrics linked to recipe |

---

## 17. Blueprinting Questions For Eratex

1. What is the official current list of wash families offered to customers?
2. Which wash processes are performed in-house and which are outsourced?
3. Is sandblasting still operationally used, or is it only historical website wording?
4. Which buyers prohibit sandblasting, PP spray, chlorine bleach, or specific resin chemistry?
5. What machine groups exist today by make, capacity, and supported process?
6. Which machines are front-loading, belly type, Tonello, Brongo, Tolkar, Yilmax, Ramson, laser, hydro, dryer, conveyor dryer, PP booth, mannequin, ozone, or other specialty equipment?
7. Are wash routes standardized by buyer/style, or created order-by-order?
8. Are recipe parameters stored digitally today?
9. Does Datatex or another ERP hold wash route, wash code, recipe, or machine assignment data?
10. Are laser files version-controlled and tied to style/wash code?
11. Is EIM used at style development, bulk production, or reporting level?
12. Are ZDHC wastewater tests linked to production periods or only compliance reporting?
13. Is recycled water used for all wash routes or only selected process types?
14. How is shade lot preserved from cutting/sewing into laundry batching?
15. Are wash batches created by order, CMT, PO, style, shade lot, or machine capacity?
16. Who can approve rewash?
17. What is the current rewash rate by buyer, style, wash type, and machine group?
18. How is drying capacity planned today?
19. Are customer-preferred machines or restricted machines part of planning?
20. Which laundry events must be visible to the planning and scheduling tool in real time?

---

## 18. Practical Capability Taxonomy For Eratex Planning

For the scheduling platform, a useful capability taxonomy would be:

```text
Laundry
  Dry process
    Laser
    Whiskering
    Scraping
    Grinding
    Destroy/repair
    PP/local spray
    3D/mannequin/resin, if applicable
  Wet process
    Rinse/one wash
    Desize
    Enzyme
    Stone
    Stone-enzyme
    Bleach
    Acid/moon/snow
    Ozone, if applicable
    Garment dye/overdye
    Tint
    Softener
  Water removal and drying
    Hydro extraction
    Tumble drying
    Conveyor drying
    Curing, if applicable
  Quality control
    Shade
    Effect
    Measurement
    Hand feel
    Fastness
    Defect hold
  Recovery
    Touch-up
    Rewash
    Re-dry
    Shade correction
    QC waiver
```

---

## 19. Implementation View For The Scheduling Tool

### 19.1 Minimum Viable Laundry Model

At minimum, the tool should support:

- Wash route master.
- Machine group master.
- Batch size and cycle-time master.
- Dry process flag.
- Wet process route.
- Dryer capacity.
- Shade-lot grouping.
- Post-wash QC status.
- Rewash reason and capacity impact.
- Release to finishing.

### 19.2 Advanced Model

Later phases can add:

- Recipe parameter tracking.
- Chemical inventory consumption.
- EIM score capture.
- Laser file integration.
- Machine IoT/PLC integration.
- Auto-capture of washer program start/end.
- Image-based shade/effect comparison.
- Water/energy/chemical actuals per batch.
- Optimization of batch sequencing by route, shipment risk, and sustainability score.

---

## 20. Key Takeaway

Eratex's public material supports the view that laundry is a strategic capability, especially for denim bottoms. The website explicitly identifies in-house washing, basic stone bleach, garment dye development, sand blasting, scraping, and whiskering. The annual and sustainability reports show that Eratex has continued investing in sustainable and automated laundry assets, including washers, compact laser machines, front-loading machines, hydro extraction, conveyor drying, wastewater treatment, chemical management, and water reuse.

For the planning and scheduling platform, the correct design response is to model laundry as a route-driven, machine-constrained, quality-gated, and sustainability-sensitive production domain. This is essential because laundry can become the hidden bottleneck even after sewing appears complete.

---

## 21. Sources Used

### Official Eratex Sources

- [Eratex official website](https://www.eratexco.com/)
- [Eratex garment products page](https://www.eratexco.com/our-products/)
- [Eratex garment operations page](https://www.eratexco.com/garment-operations/)
- [Eratex Annual Report 2025](https://www.eratexco.com/wp-content/uploads/2026/04/AR-2025-final1.pdf)
- [Eratex Sustainability Report 2025](https://www.eratexco.com/wp-content/uploads/2026/04/2025-SR-final1.pdf)
- [Eratex Sustainability Report 2024](https://www.eratexco.com/wp-content/uploads/2025/04/2024-SR-Final.pdf)

### Local Eratex Research Sources

- `F:\eratex\docs\research\Eratex_Solution_Deck_Synthesis.md`
- `F:\eratex\docs\10_Wash_Planning_Execution_Specification_Eratex.md`

### Generic Industry / Governance References

- [ZDHC MRSL and Roadmap to Zero resources](https://www.roadmaptozero.com/mrsl)
- [Jeanologia technology reference](https://www.jeanologia.com/)
- General denim laundry and garment finishing practice, to be validated against Eratex buyer manuals, actual machine manuals, chemical supplier data sheets, approved wash recipes, and quality standards.

