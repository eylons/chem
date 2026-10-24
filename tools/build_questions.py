#!/usr/bin/env python3
"""Generate js/questions.js (built-in Midterm 1 bank) from JSON data.

The bank is emitted as JSON so no JavaScript string is ever hand-quoted.
Run from the repo root:  python3 tools/build_questions.py
"""
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent.parent
LEGACY = json.loads((ROOT / "tools" / "builtin_mt1_legacy.json").read_text(encoding="utf-8"))

# Deterministic replacement for the old random pka-variation-NN questions.
# Same IDs and same answer format as the old app, but stable content.
LADDER = [-7, -5, -3, -2, 5, 9, 16, 36]
pairs = [(a, b) for a in LADDER for b in LADDER if a != b]
step = max(1, len(pairs) // 28)
PKA = []
for index, (acid, conj) in enumerate(pairs[::step][:28]):
    favored = "right" if conj > acid else "left"
    PKA.append({
        "id": "pka-variation-%02d" % (index + 1),
        "course": "mt1", "topic": "Acid/base equilibrium", "type": "text", "difficulty": 1,
        "skills": ["acid-base equilibrium", "pKa"], "drill": True,
        "question": "For HA + B⁻ ⇌ A⁻ + HB, pKa(HA) = %d and pKa(HB) = %d. Which side is favored? Answer left or right." % (acid, conj),
        "acceptedAnswers": [favored],
        "hint": "Equilibrium favors the side containing the acid with the higher pKa.",
        "explanation": "The %s side contains the weaker acid (higher pKa), so equilibrium favors that side." % favored,
    })

NEW = [
    {
        "id": "mq-select-stereocenter-2-butanol", "course": "mt1", "topic": "Stereocenter detection",
        "type": "select-atom", "difficulty": 1, "skills": ["stereocenter detection", "structure interpretation"],
        "question": "Butan-2-ol is drawn below with every carbon labelled. Select the stereogenic carbon.",
        "structure": {"viewBox": "0 0 330 140", "atoms": [
            {"id": "A", "label": "CH₃", "x": 40, "y": 95}, {"id": "B", "label": "CH", "x": 120, "y": 95},
            {"id": "C", "label": "OH", "x": 120, "y": 30}, {"id": "D", "label": "CH₂", "x": 205, "y": 95},
            {"id": "E", "label": "CH₃", "x": 290, "y": 95}],
            "bonds": [{"from": "A", "to": "B", "order": 1}, {"from": "B", "to": "C", "order": 1},
                      {"from": "B", "to": "D", "order": 1}, {"from": "D", "to": "E", "order": 1}]},
        "answer": "B",
        "hints": ["A stereocenter needs four different groups.",
                  "CH₃ and CH₂ carbons carry repeated hydrogens, so they cannot be stereogenic.",
                  "List the four groups on each remaining candidate carbon: H, OH, and the two carbon chains on either side. Are the two chains identical?"],
        "explanation": "Only the CH carbon (B) carries four different groups: H, OH, CH₃ and CH₂CH₃.",
        "keyRule": "Stereocenter = sp³ carbon with four different groups. Check, do not assume.",
    },
    {
        "id": "mq-select-acidic-h", "course": "mt1", "topic": "Acid/base reasoning",
        "type": "select-atom", "difficulty": 2, "skills": ["ARIO: resonance", "pKa", "structure interpretation"],
        "question": "Select the oxygen that carries the most acidic hydrogen in 3-hydroxypropanoic acid.",
        "structure": {"viewBox": "0 0 350 140", "atoms": [
            {"id": "A", "label": "HO", "x": 35, "y": 95}, {"id": "B", "label": "CH₂", "x": 110, "y": 95},
            {"id": "C", "label": "CH₂", "x": 185, "y": 95}, {"id": "D", "label": "C", "x": 255, "y": 95},
            {"id": "E", "label": "O", "x": 255, "y": 30}, {"id": "F", "label": "OH", "x": 320, "y": 95}],
            "bonds": [{"from": "A", "to": "B", "order": 1}, {"from": "B", "to": "C", "order": 1},
                      {"from": "C", "to": "D", "order": 1}, {"from": "D", "to": "E", "order": 2},
                      {"from": "D", "to": "F", "order": 1}]},
        "answer": "F",
        "hints": ["Compare the conjugate bases you would get by removing each O–H proton.",
                  "Ask which conjugate base can spread its negative charge by resonance (the R in ARIO).",
                  "Recall the course pKa values for an alcohol O–H and for an O–H on a carbon that is also double-bonded to O."],
        "explanation": "The carboxylic acid O–H (pKa ≈ 5) is far more acidic than the alcohol O–H (pKa ≈ 16) because carboxylate is resonance-stabilized over two oxygens.",
        "keyRule": "Most acidic H = the one whose conjugate base is most stable (ARIO).",
    },
    {
        "id": "mq-select-carbocation-site", "course": "mt1", "topic": "Markovnikov selectivity",
        "type": "select-atom", "difficulty": 1, "skills": ["Markovnikov regiochemistry", "carbocation stability", "structure interpretation"],
        "question": "2-Methylpropene reacts with HBr. The π bond is protonated to give the more stable carbocation. Select the carbon that carries the positive charge.",
        "structure": {"viewBox": "0 0 300 160", "atoms": [
            {"id": "A", "label": "H₂C", "x": 50, "y": 85}, {"id": "B", "label": "C", "x": 145, "y": 85},
            {"id": "C", "label": "CH₃", "x": 225, "y": 35}, {"id": "D", "label": "CH₃", "x": 225, "y": 135}],
            "bonds": [{"from": "A", "to": "B", "order": 2}, {"from": "B", "to": "C", "order": 1},
                      {"from": "B", "to": "D", "order": 1}]},
        "answer": "B",
        "hints": ["H⁺ adds to one alkene carbon; the other becomes the carbocation.",
                  "Compare the two possible cations: one would be primary, one tertiary.",
                  "The carbocation forms on the alkene carbon that already has more carbon substituents."],
        "explanation": "Protonating the CH₂ end puts the positive charge on the central carbon, a tertiary carbocation (Markovnikov).",
        "keyRule": "Markovnikov: protonate to form the more substituted (more stable) carbocation.",
    },
    {
        "id": "mq-rank-carbocations", "course": "mt1", "topic": "Carbocation stability",
        "type": "rank", "difficulty": 1, "skills": ["carbocation stability"],
        "question": "Rank these carbocations from least stable to most stable (no resonance).",
        "items": ["Methyl (CH₃⁺)", "Primary (1°)", "Secondary (2°)", "Tertiary (3°)"],
        "answer": ["Methyl (CH₃⁺)", "Primary (1°)", "Secondary (2°)", "Tertiary (3°)"],
        "hints": ["Alkyl groups donate electron density to the cationic carbon.",
                  "More alkyl substituents on C⁺ means more stabilization (hyperconjugation and induction).",
                  "Count the carbons attached directly to C⁺ in each case: 0, 1, 2 or 3."],
        "explanation": "Stability rises with substitution: methyl < 1° < 2° < 3°.",
    },
    {
        "id": "mq-rank-ch-acidity", "course": "mt1", "topic": "ARIO: orbital",
        "type": "rank", "difficulty": 2, "skills": ["ARIO: orbital", "pKa"],
        "question": "Rank these C–H acids from weakest acid to strongest acid.",
        "items": ["Ethane (sp³ C–H)", "Ethene (sp² C–H)", "Ethyne (sp C–H)"],
        "answer": ["Ethane (sp³ C–H)", "Ethene (sp² C–H)", "Ethyne (sp C–H)"],
        "hints": ["Look at the conjugate base: where does the lone pair sit?",
                  "More s character holds the lone pair closer to the nucleus.",
                  "Course pKa table: alkane ≈ 50, alkene ≈ 44, alkyne ≈ 25. Lower pKa = stronger acid."],
        "explanation": "Acidity rises with s character of the carbanion orbital: sp³ < sp² < sp (pKa 50 > 44 > 25).",
    },
    {
        "id": "mq-text-e1-zaitsev", "course": "mt1", "topic": "E1 selectivity",
        "type": "text", "difficulty": 2, "skills": ["E1", "Zaitsev selectivity", "reaction classification"],
        "question": "2-Methylbutan-2-ol is heated with H₂SO₄. Name the major alkene product.",
        "acceptedAnswers": ["2-methyl-2-butene", "2-methylbut-2-ene", "2-methyl but-2-ene", "(CH3)2C=CHCH3", "(CH₃)₂C=CHCH₃"],
        "hints": ["Heat with acid and an alcohol: which mechanism does CHEM 233 cue?",
                  "Protonate OH, lose water, then remove a β-H. Which β-H gives the most substituted alkene?",
                  "Two alkenes are possible: a disubstituted terminal alkene or a trisubstituted internal alkene. Zaitsev picks one."],
        "explanation": "E1 via the tertiary carbocation; Zaitsev favors the trisubstituted alkene, 2-methylbut-2-ene.",
        "keyRule": "Heat = E1 cue. Zaitsev: the more substituted alkene is major.",
    },
    {
        "id": "mq-text-stereocount-butene", "course": "mt1", "topic": "Stereochemical product count",
        "type": "text", "difficulty": 2, "skills": ["stereochemical product count", "acid-catalyzed hydration/solvation", "stereocenter detection"],
        "question": "But-1-ene is treated with H₂O / H₂SO₄. How many stereoisomeric products form? Answer with a number.",
        "acceptedAnswers": ["2", "two", "2 enantiomers", "two enantiomers"],
        "hints": ["First draw the Markovnikov product.",
                  "Does the carbon bearing the new OH have four different groups?",
                  "The planar carbocation can be attacked from either face; one new stereocenter with no other stereocenter present gives a specific relationship."],
        "explanation": "The product is butan-2-ol; C2 is a new stereocenter and attack occurs from both faces, giving 2 enantiomers.",
        "keyRule": "One new stereocenter, no other stereocenter: two enantiomers.",
    },
    {
        "id": "mq-text-ez-chloropropene", "course": "mt1", "topic": "E/Z",
        "type": "text", "difficulty": 1, "skills": ["E/Z", "CIP priority"],
        "question": "In 1-chloropropene (ClCH=CHCH₃), Cl and CH₃ are on opposite sides of the double bond. Is this isomer E or Z?",
        "acceptedAnswers": ["E", "(E)", "E-1-chloropropene", "(E)-1-chloropropene"],
        "hints": ["Assign CIP priority separately on each alkene carbon.",
                  "On C1 compare Cl vs H; on C2 compare CH₃ vs H.",
                  "Are the two higher-priority groups on the same side or opposite sides?"],
        "explanation": "Cl and CH₃ are the higher-priority groups and they are on opposite sides, so the alkene is E.",
        "keyRule": "E/Z uses CIP on each alkene carbon: same side = Z, opposite = E.",
    },
    {
        "id": "mq-choice-arrow-proton-move", "course": "mt1", "topic": "Resonance recognition",
        "type": "choice", "difficulty": 2, "skills": ["resonance recognition", "acid-base equilibrium"],
        "question": "Two structures differ only in that an H has moved from an oxygen to a nitrogen. Which arrow connects them?",
        "choices": ["Equilibrium arrow (⇌): a proton moved, so this is a reaction",
                    "Resonance arrow (↔): only electrons moved",
                    "Either arrow is acceptable",
                    "No arrow: they are the same structure"],
        "answer": "Equilibrium arrow (⇌): a proton moved, so this is a reaction",
        "hints": ["Ask: did any nucleus move, or only electrons?",
                  "Moving an H breaks one σ bond and forms another.",
                  "Resonance contributors must keep exactly the same σ skeleton."],
        "explanation": "An H moved, so σ bonds changed: that is a proton transfer (equilibrium), not resonance.",
        "keyRule": "If atoms or H move, it is a reaction/equilibrium. If only electrons move, it is resonance.",
    },
    {
        "id": "mq-text-classify-methanol-addition", "course": "mt1", "topic": "Reaction classification",
        "type": "text", "difficulty": 2, "skills": ["reaction classification", "electrophilic alkene addition"],
        "question": "1-Methylcyclohexene is treated with H₂SO₄ in CH₃OH (no heat). Name the reaction class.",
        "acceptedAnswers": ["electrophilic addition", "electrophilic alkene addition", "alkene addition", "acid-catalyzed addition", "electrophilic addition (solvation)", "acid-catalyzed solvation", "solvation"],
        "hints": ["Look at the starting material's functional group first.",
                  "Is there a leaving group on an sp³ carbon, or a π bond?",
                  "SN1/E1 begin with a leaving group departing. What is the first step here instead?"],
        "explanation": "The starting material is an alkene; the first step is protonation of the π bond, so this is electrophilic addition (acid-catalyzed solvation), not SN1/E1.",
        "keyRule": "Alkene + acid + H₂O/ROH = electrophilic addition, not SN1/E1.",
    },
    {
        "id": "mq-draw-hydration-mechanism", "course": "mt1", "topic": "Mechanism completeness",
        "type": "draw", "difficulty": 3, "skills": ["curved-arrow mechanisms", "acid-catalyzed hydration/solvation", "formal charge", "mechanism steps"],
        "question": "On paper: draw the full curved-arrow mechanism for 2-methylpropene + H₂O / H₂SO₄. Show every intermediate and formal charge.",
        "hints": ["Three steps: protonation, nucleophilic attack, proton transfer.",
                  "Which carbocation forms: primary or tertiary? Water is the neutral nucleophile.",
                  "After water attacks, count bonds on oxygen. What charge does it carry before the last step?"],
        "rubric": {
            "answer": "Step 1: the C=C π bond attacks H of H₃O⁺ (arrow from π bond to H, second arrow from H–O bond to O) giving the tertiary carbocation. Step 2: a water lone pair attacks C⁺ giving an oxonium ion (O⁺ with three bonds). Step 3: water removes an H from the oxonium (arrow from O–H bond to O⁺) giving tert-butanol and H₃O⁺.",
            "full": ["Tertiary carbocation (Markovnikov)", "Neutral H₂O attacks, giving oxonium with + on O", "Separate deprotonation step to neutral alcohol", "Arrows start at π bond / lone pair / breaking bond", "All formal charges shown"],
            "minor": ["One missing formal charge", "Arrow slightly misplaced but electron source is clear", "Used H₂SO₄ instead of H₃O⁺ as proton source (accepted by course)"],
            "major": ["Primary carbocation or anti-Markovnikov product", "HO⁻ used as the nucleophile", "Oxonium intermediate or deprotonation step skipped", "Called it SN1/E1"],
        },
        "explanation": "Electrophilic addition: protonation to the tertiary cation, neutral water attack to oxonium, then deprotonation to tert-butanol.",
        "keyRule": "Neutral O nucleophile attacks C⁺ to give O⁺; deprotonate as a separate step.",
    },
    {
        "id": "mq-draw-hbr-methylcyclohexene", "course": "mt1", "topic": "Stereochemical product count",
        "type": "draw", "difficulty": 3, "skills": ["stereochemical product count", "Markovnikov regiochemistry", "stereocenter detection"],
        "question": "On paper: predict and draw the major product of 1-methylcyclohexene + HBr. Show stereochemistry and all stereoisomers if any form.",
        "hints": ["Which alkene carbon becomes the carbocation?",
                  "Br adds where the tertiary carbocation was. Now inspect that carbon.",
                  "Walk around the ring both ways from the C–Br carbon. Are the two ring paths different?"],
        "rubric": {
            "answer": "1-Bromo-1-methylcyclohexane: Br and CH₃ on the same ring carbon. That carbon is NOT a stereocenter (its two ring paths are identical), so exactly one product forms. Draw no wedge/dash and no enantiomer.",
            "full": ["Br on the former tertiary carbon (Markovnikov)", "Recognized no stereocenter is created", "Exactly one product drawn"],
            "minor": ["Correct product but unnecessary wedge/dash notation", "Small skeletal drawing slip"],
            "major": ["Br on the less substituted carbon", "Drew two enantiomers for a carbon with identical ring paths", "Treated it as SN1/E1"],
        },
        "explanation": "Markovnikov addition via the tertiary cation; the product carbon has two identical ring paths, so no stereoisomers.",
        "keyRule": "Before drawing two products, confirm the new carbon has four different groups.",
    },
]

out = LEGACY + PKA + NEW
ids = [q["id"] for q in out]
assert len(ids) == len(set(ids)), "duplicate built-in question id"
for q in out:
    q.setdefault("course", "mt1")
    q["builtin"] = True

body = json.dumps(out, ensure_ascii=False, indent=1)
assert " " not in body and " " not in body
js = ("/* Generated by tools/build_questions.py. Do not edit by hand. */\n"
      "\"use strict\";\n"
      "window.MQ = window.MQ || {};\n"
      "window.MQ.BUILTIN_QUESTIONS = " + body + ";\n")
(ROOT / "js" / "questions.js").write_text(js, encoding="utf-8")
print("wrote js/questions.js with", len(out), "questions")
