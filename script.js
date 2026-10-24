"use strict";

const SAVE_KEY = "chem233-mechanism-quest-save-v1";
const THEME_KEY = "chem233-mechanism-quest-theme";
const SAVE_VERSION = 1;
const DAY_MS = 86400000;

const questionBank = [
  { id:"acid-equilibrium-1", course:"mt1", topic:"Acid/base equilibrium", type:"choice", difficulty:1, skills:["acid-base equilibrium","pKa"], question:"For HA + B⁻ ⇌ A⁻ + HB, pKa(HA) = 5 and pKa(HB) = 12. Which side is favored?", choices:["Left, because HA is the stronger acid","Right, because HB is the weaker acid","Left, because B⁻ is the weaker base","The two sides are equally favored"], answer:"Right, because HB is the weaker acid", hint:"Compare the acids on each side. Equilibrium favors the acid with the higher pKa.", explanation:"HB (pKa 12) is the weaker acid than HA (pKa 5), so the equilibrium favors the right-hand side containing the weaker acid and weaker base." },
  { id:"acid-equilibrium-2", course:"mt1", topic:"Acid/base equilibrium", type:"choice", difficulty:1, skills:["acid-base equilibrium","pKa"], question:"An acid with pKa 9 is mixed with a base whose conjugate acid has pKa 16. Which direction is favored?", choices:["Toward products, because the product-side acid is weaker","Toward reactants, because the reactant-side acid is weaker","Neither; pKa does not predict direction","Toward products only if heated"], answer:"Toward products, because the product-side acid is weaker", hint:"Identify the acid on each side and compare their pKa values.", explanation:"The product-side conjugate acid has the higher pKa (16), so products contain the weaker acid and are favored." },
  { id:"pka-ladder", course:"mt1", topic:"pKa recall", type:"rank", difficulty:1, skills:["pKa"], question:"Order these acids from lowest pKa (strongest acid) to highest pKa (weakest acid).", items:["HCl (−7)","H₂SO₄ (−3)","Carboxylic acid (5)","Phenol (9)","Alcohol (16)","H₂ (36)"], answer:["HCl (−7)","H₂SO₄ (−3)","Carboxylic acid (5)","Phenol (9)","Alcohol (16)","H₂ (36)"], hint:"The course memory ladder is approximately −7, −5, −3, −2, 5, 9, 16, 36.", explanation:"Increasing pKa corresponds to decreasing acidity. These approximate course-table values follow −7 < −3 < 5 < 9 < 16 < 36." },
  { id:"ario-atom", course:"mt1", topic:"ARIO: atom", type:"choice", difficulty:1, skills:["ARIO: atom"], question:"Which conjugate base is more stabilized by the atom holding the negative charge?", choices:["CH₃O⁻","CH₃S⁻"], answer:"CH₃S⁻", hint:"The negatively charged atoms are in different rows of the periodic table.", explanation:"Sulfur is larger and more polarizable than oxygen, so it stabilizes negative charge better when comparing atoms in different rows." },
  { id:"ario-orbital", course:"mt1", topic:"ARIO: orbital", type:"rank", difficulty:1, skills:["ARIO: orbital"], question:"Rank these carbanions by conjugate-base stability, least stable to most stable, assuming comparable substitution and no resonance.", items:["sp³ carbanion","sp² carbanion","sp carbanion"], answer:["sp³ carbanion","sp² carbanion","sp carbanion"], hint:"More s-character stabilizes a negative charge.", explanation:"Greater s-character holds electron density closer to the nucleus: sp³ < sp² < sp in stability." },
  { id:"ario-resonance", course:"mt1", topic:"ARIO: resonance", type:"choice", difficulty:1, skills:["ARIO: resonance"], question:"Which anion is more stabilized by resonance?", choices:["Phenoxide, with charge delocalized into the aromatic ring","Ethoxide, with charge localized on one oxygen"], answer:"Phenoxide, with charge delocalized into the aromatic ring", hint:"Compare whether the negative charge can be distributed over multiple atoms.", explanation:"Phenoxide has resonance contributors that delocalize charge over oxygen and ring carbons; ethoxide has no comparable resonance delocalization." },
  { id:"ario-induction", course:"mt1", topic:"ARIO: induction", type:"choice", difficulty:1, skills:["ARIO: induction"], question:"Which carboxylate conjugate base is more stabilized inductively?", choices:["CF₃CO₂⁻","CH₃CO₂⁻"], answer:"CF₃CO₂⁻", hint:"Fluorine atoms withdraw electron density through sigma bonds.", explanation:"The strongly electron-withdrawing CF₃ group stabilizes nearby negative charge by induction. The effect decreases with distance." },
  { id:"phenol-vs-benzyl", course:"mt1", topic:"Acid/base reasoning", type:"choice", difficulty:2, skills:["ARIO: resonance","acid-base equilibrium"], question:"Which is more acidic: phenol or benzyl alcohol (Ph–CH₂OH)?", choices:["Phenol, because phenoxide is resonance stabilized","Benzyl alcohol, because its ring is aromatic","They are equally acidic because both contain an O–H","Benzyl alcohol, because its oxygen is directly attached to the ring"], answer:"Phenol, because phenoxide is resonance stabilized", hint:"After deprotonation, check whether the oxygen is directly conjugated with the ring.", explanation:"Phenoxide is conjugated directly with the aromatic ring. In benzyl alcohol, the intervening CH₂ interrupts that conjugation." },
  { id:"resonance-vs-equilibrium", course:"mt1", topic:"Resonance recognition", type:"choice", difficulty:1, skills:["resonance recognition"], question:"Two drawings have the same atoms and sigma-bond connectivity; only a π bond and formal charge have shifted. What relates them?", choices:["Resonance contributors","Acid–base equilibrium","Constitutional isomers","Conformers"], answer:"Resonance contributors", hint:"Check whether any atom or proton moved, or any sigma bond changed.", explanation:"Only electrons and formal charges moved while the sigma skeleton stayed fixed, so the drawings are resonance contributors. Use a resonance arrow, not an equilibrium arrow." },
  { id:"resonance-validity", course:"mt1", topic:"Resonance recognition", type:"choice", difficulty:2, skills:["resonance recognition","formal charge"], question:"Which proposed change is NOT allowed when drawing a resonance contributor?", choices:["Move a lone pair to form a π bond","Shift a π bond and move its electron pair to an adjacent atom","Move a proton and break its C–H sigma bond","Redistribute charge while keeping sigma connectivity fixed"], answer:"Move a proton and break its C–H sigma bond", hint:"Resonance moves electrons, not nuclei or sigma-bond connectivity.", explanation:"Moving a proton or breaking/forming a sigma bond is a chemical reaction, not a resonance move." },
  { id:"resonance-draw", course:"mt1", topic:"Drawing resonance contributors", type:"draw", difficulty:2, skills:["drawing resonance contributors","formal charge"], question:"Draw both valid resonance contributors for the allylic cation CH₂=CH–CH₂⁺. Keep the atom skeleton fixed.", hint:"Move the π-electron pair toward the carbocation; place the positive charge at the opposite end.", rubric:"Start from CH₂=CH–CH₂⁺. The π pair forms a double bond between the middle and right carbons; the positive charge moves to the left terminal carbon. Keep the same atom connectivity and use a resonance arrow.", explanation:"The positive charge is delocalized over the two terminal carbons by the adjacent π system." },
  { id:"aromaticity-4", course:"mt1", topic:"Aromaticity", type:"choice", difficulty:1, skills:["aromaticity"], question:"A planar, cyclic, continuously conjugated ring has 6 π electrons. Under the course aromaticity test, it is:", choices:["Aromatic","Anti-aromatic by the 4n rule","Nonaromatic because it has an even number of electrons","Impossible to classify without a heteroatom"], answer:"Aromatic", hint:"Apply the 4n + 2 rule after confirming planarity and continuous conjugation.", explanation:"Six π electrons fit 4n + 2 with n = 1. The other required conditions are stated in the prompt." },
  { id:"aromaticity-heteroatom", course:"mt1", topic:"Aromaticity", type:"choice", difficulty:2, skills:["aromaticity","lone-pair orbitals"], question:"When counting π electrons in a heteroaromatic ring, what is the correct approach?", choices:["Count every lone pair on every heteroatom automatically","Decide which lone pair occupies a p orbital and participates in the conjugated ring","Count only electrons in formal double bonds","Exclude all heteroatom lone pairs"], answer:"Decide which lone pair occupies a p orbital and participates in the conjugated ring", hint:"Not every lone pair participates in the aromatic π system.", explanation:"A lone pair contributes only when it occupies the p orbital in the continuous conjugated framework. Other lone pairs remain localized in hybrid orbitals." },
  { id:"hybrid-domains", course:"mt1", topic:"Hybridization", type:"choice", difficulty:1, skills:["hybridization"], question:"Using the course shortcut, an atom with three electron domains (sigma bonds + lone pairs) is usually:", choices:["sp","sp²","sp³","sp³d"], answer:"sp²", hint:"Use 2 domains → sp, 3 → sp², 4 → sp³, unless resonance changes the expectation.", explanation:"Three electron domains correspond to sp² hybridization in the course shortcut." },
  { id:"carbonyl-oxygen", course:"mt1", topic:"Lone-pair orbitals", type:"choice", difficulty:2, skills:["lone-pair orbitals","hybridization"], question:"For a typical carbonyl oxygen, which orbital statement matches the lecture convention?", choices:["Both lone pairs are in p orbitals and one makes the C=O π bond","The unhybridized p orbital participates in the C=O π bond; lone pairs are in sp² hybrids","The oxygen is sp³ and has no p orbital","One lone pair makes a sigma bond to carbon"], answer:"The unhybridized p orbital participates in the C=O π bond; lone pairs are in sp² hybrids", hint:"Separate the orbital making the π bond from the oxygen's nonbonding pairs.", explanation:"The carbonyl π bond uses an unhybridized p orbital on oxygen. Its lone pairs occupy sp² hybrid orbitals." },
  { id:"amide-lp", course:"mt1", topic:"Lone-pair orbitals", type:"choice", difficulty:2, skills:["lone-pair orbitals","ARIO: resonance"], question:"Why is an amide nitrogen less basic than a typical amine nitrogen?", choices:["Its lone pair is delocalized into the adjacent carbonyl","Nitrogen has no lone pair in an amide","The carbonyl inductively makes nitrogen positively charged","The amide nitrogen is always sp³"], answer:"Its lone pair is delocalized into the adjacent carbonyl", hint:"Consider whether the lone pair is available to bind a proton or participates in resonance.", explanation:"The amide lone pair is delocalized into the carbonyl system, making it less available for protonation." },
  { id:"functional-amide", course:"mt1", topic:"Functional groups", type:"choice", difficulty:1, skills:["functional groups"], question:"A carbonyl carbon directly bonded to nitrogen identifies which functional group?", choices:["Ester","Amide","Anhydride","Aldehyde"], answer:"Amide", hint:"Look at the atom directly attached to the carbonyl carbon.", explanation:"A carbonyl directly attached to nitrogen is an amide." },
  { id:"functional-acetal", course:"mt1", topic:"Functional groups", type:"choice", difficulty:2, skills:["functional groups"], question:"Using the CHEM 233 convention, an aldehyde-derived carbon attached to two –OR groups is a:", choices:["Ketal","Acetal","Hemiketal","Hemiacetal"], answer:"Acetal", hint:"This course distinguishes aldehyde-derived (acetal) and ketone-derived (ketal) centers.", explanation:"An aldehyde-derived center with two OR groups is classified as an acetal in this course." },
  { id:"functional-n-class", course:"mt1", topic:"Functional groups", type:"choice", difficulty:1, skills:["functional groups"], question:"An amine nitrogen is directly attached to two carbon groups and one hydrogen. It is:", choices:["Primary","Secondary","Tertiary","Quaternary"], answer:"Secondary", hint:"Count carbon groups directly bonded to nitrogen, not total bonds including hydrogen.", explanation:"Two carbon groups attached to N means a secondary amine." },
  { id:"functional-hemiketal", course:"mt1", topic:"Functional groups", type:"choice", difficulty:2, skills:["functional groups"], question:"A ketone-derived center attached to one –OR and one –OH is, by CHEM 233 convention, a:", choices:["Hemiacetal","Hemiketal","Acetal","Ketal"], answer:"Hemiketal", hint:"Identify ketone-derived versus aldehyde-derived first.", explanation:"A ketone-derived center with one OR and one OH is a hemiketal under the supplied course convention." },
  { id:"formal-charge-oxonium", course:"mt1", topic:"Formal charge", type:"choice", difficulty:1, skills:["formal charge","mechanism steps"], question:"Neutral water attacks a carbocation using one lone pair and forms two O–H bonds plus one O–C bond. The oxygen in the immediate adduct is:", choices:["Neutral, because water started neutral","Positive, because it now has three bonds and one lone pair","Negative, because it donated a lone pair","A carbocation"], answer:"Positive, because it now has three bonds and one lone pair", hint:"Count oxygen's bonds and lone pairs immediately after attack, before deprotonation.", explanation:"The oxonium intermediate has three bonds and one lone pair on oxygen, giving it a formal charge of +1. A later deprotonation produces neutral alcohol." },
  { id:"cip-br", course:"mt1", topic:"CIP priority", type:"choice", difficulty:1, skills:["CIP priority"], question:"At a stereocenter, compare a directly attached carbon bearing Br, C, H with another directly attached carbon bearing O, C, H. Which carbon substituent has higher priority?", choices:["The carbon bearing Br","The carbon bearing O","They tie because both attach through carbon","The answer depends only on molecular mass"], answer:"The carbon bearing Br", hint:"The directly attached atoms tie as carbon, so compare the next attached-atom sets in descending atomic number.", explanation:"At the first difference, Br (atomic number 35) outranks O (8), so that substituent has higher priority." },
  { id:"cip-carbonyl", course:"mt1", topic:"CIP priority", type:"choice", difficulty:2, skills:["CIP priority"], question:"For CIP comparison, a carbonyl carbon is treated as though it is attached to:", choices:["O and one other atom","O, O, and its third substituent","Only the carbonyl oxygen","Two hydrogens and an oxygen"], answer:"O, O, and its third substituent", hint:"Multiple bonds are handled by a duplicate-atom convention.", explanation:"A C=O carbon is compared as if attached to two O atoms and its third substituent." },
  { id:"cip-ome-oh", course:"mt1", topic:"CIP priority", type:"choice", difficulty:2, skills:["CIP priority"], question:"When directly comparing –OCH₃ and –OH substituents under CIP, which has higher priority?", choices:["–OCH₃","–OH","They tie permanently because both begin with oxygen","Neither can receive CIP priority"], answer:"–OCH₃", hint:"The directly attached atoms tie as oxygen; compare the next atom attached to each oxygen.", explanation:"The next atom is carbon for OCH₃ and hydrogen for OH; carbon outranks hydrogen." },
  { id:"rs-basic", course:"mt1", topic:"R/S", type:"choice", difficulty:1, skills:["R/S"], question:"After assigning CIP priorities, priority 4 points away. The 1 → 2 → 3 path is counterclockwise. The configuration is:", choices:["R","S","E","Z"], answer:"S", hint:"With priority 4 pointing away, read the direction without reversing.", explanation:"Counterclockwise with the lowest-priority group away is S." },
  { id:"rs-toward", course:"mt1", topic:"R/S", type:"choice", difficulty:2, skills:["R/S"], question:"The 1 → 2 → 3 path appears clockwise, but priority 4 points toward the viewer. What is the configuration?", choices:["R","S","E","Z"], answer:"S", hint:"When priority 4 points toward you, reverse the apparent result.", explanation:"Clockwise would be R with priority 4 away; because it points toward the viewer, reverse to S." },
  { id:"ez", course:"mt1", topic:"E/Z", type:"choice", difficulty:1, skills:["E/Z"], question:"On an alkene, the higher-priority substituents on the two alkene carbons are on opposite sides. The geometry is:", choices:["E","Z","R","S"], answer:"E", hint:"E comes from entgegen, opposite; Z means together.", explanation:"Opposite-side high-priority groups give E geometry." },
  { id:"fischer", course:"mt1", topic:"Fischer projections", type:"choice", difficulty:1, skills:["Fischer/Newman/wedge-dash conversion"], question:"In a Fischer projection, the horizontal bonds point:", choices:["Away from the viewer","Toward the viewer","Along the page plane","Only toward the highest-priority group"], answer:"Toward the viewer", hint:"Horizontal and vertical bonds have opposite viewing directions.", explanation:"Fischer horizontal bonds project toward the viewer; vertical bonds project away." },
  { id:"stereocenter", course:"mt1", topic:"Stereocenter detection", type:"choice", difficulty:1, skills:["stereocenter detection","stereochemical product count"], question:"A tetrahedral carbon is attached to H, OH, CH₃, and CH₃. Is it a stereogenic center?", choices:["Yes, because it has four bonds","Yes, because OH is present","No, because two substituents are identical","No, because carbon cannot be stereogenic"], answer:"No, because two substituents are identical", hint:"Check for four different groups; wedge/dash appearance by itself is not sufficient.", explanation:"The two methyl groups are identical, so the carbon does not have four different substituents and is not stereogenic." },
  { id:"isomer-connectivity", course:"mt1", topic:"Isomer relationships", type:"choice", difficulty:1, skills:["isomer relationship classification"], question:"Two compounds have the same molecular formula but different atom connectivity. Their relationship is:", choices:["Constitutional isomers","Enantiomers","Conformers","Identical"], answer:"Constitutional isomers", hint:"Check connectivity before analyzing 3D arrangement.", explanation:"Same formula with different connectivity defines constitutional isomers." },
  { id:"isomer-formula", course:"mt1", topic:"Isomer relationships", type:"choice", difficulty:2, skills:["isomer relationship classification"], question:"Two drawings look different, but their molecular formulas are different. They are:", choices:["Enantiomers","Diastereomers","Not isomers of each other","Conformers"], answer:"Not isomers of each other", hint:"The first step is always compare molecular formula.", explanation:"Isomers must have the same molecular formula. Different formulas mean they are not isomers." },
  { id:"isomer-enantiomer", course:"mt1", topic:"Isomer relationships", type:"choice", difficulty:2, skills:["isomer relationship classification","stereocenter detection"], question:"Two structures have the same connectivity and exactly one stereocenter, with opposite configuration at that center. They are:", choices:["Enantiomers","Diastereomers","Constitutional isomers","Conformers"], answer:"Enantiomers", hint:"With one stereocenter, inversion gives a non-superimposable mirror-image pair.", explanation:"For a molecule with a single stereocenter, opposite configurations are enantiomers." },
  { id:"newman-anti", course:"mt1", topic:"Newman projections", type:"choice", difficulty:2, skills:["Fischer/Newman/wedge-dash conversion"], question:"In a Newman projection looking down a C–C bond, two large substituents are 180° apart. Their relationship is:", choices:["Anti","Gauche","Eclipsed","Syn-periplanar"], answer:"Anti", hint:"Anti means a dihedral angle of 180°.", explanation:"Two substituents separated by 180° in a Newman projection are anti." },
  { id:"alkene-class", course:"mt1", topic:"Reaction classification", type:"choice", difficulty:1, skills:["electrophilic alkene addition","reaction classification"], question:"Starting material: an alkene. Reagents: aqueous acid. What reaction class should you identify first?", choices:["Electrophilic alkene addition","SN1","E1","Nucleophilic acyl substitution"], answer:"Electrophilic alkene addition", hint:"Classify from the starting functional group before naming the mechanism.", explanation:"Alkene + acid + water is electrophilic addition, not SN1/E1. The π bond is protonated, then water attacks." },
  { id:"markovnikov", course:"mt1", topic:"Markovnikov selectivity", type:"choice", difficulty:1, skills:["Markovnikov regiochemistry","carbocation stability"], question:"In acid-promoted addition of HX to an unsymmetrical alkene, the preferred protonation generally forms:", choices:["The more stable carbocation intermediate","The less substituted carbocation intermediate","A free carbanion","A bridged bromonium ion in every case"], answer:"The more stable carbocation intermediate", hint:"The regiochemistry follows the carbocation formed during protonation.", explanation:"Protonation is oriented to generate the more stable carbocation; the nucleophile then attacks that carbocation, giving Markovnikov regiochemistry when applicable." },
  { id:"hydration-nucleophile", course:"mt1", topic:"Acid-catalyzed hydration", type:"choice", difficulty:2, skills:["acid-catalyzed hydration/solvation","mechanism steps"], question:"In acid-catalyzed hydration, which species attacks the carbocation after alkene protonation?", choices:["Neutral H₂O","HO⁻ generated in strongly acidic solution","A water-derived O⁻","Only HSO₄⁻"], answer:"Neutral H₂O", hint:"Under the stated acidic conditions, use the neutral solvent nucleophile.", explanation:"Neutral water attacks the carbocation to form an oxonium ion. A separate deprotonation step gives the neutral alcohol." },
  { id:"planar-carbocation", course:"mt1", topic:"Stereochemical product count", type:"choice", difficulty:2, skills:["stereochemical product count","carbocation stability"], question:"A planar carbocation is attacked from either face. What must you check before drawing two different products?", choices:["Whether attack creates a real stereogenic center in the final product","Whether the starting material had a double bond","Whether the nucleophile is negatively charged","Whether there are exactly two carbocation resonance forms"], answer:"Whether attack creates a real stereogenic center in the final product", hint:"Equivalent substituents or ring paths can make the attacked carbon non-stereogenic.", explanation:"Two faces do not automatically mean two distinct stereoisomers. Check the final atom's substituents and whether a stereocenter was created." },
  { id:"carbocation", course:"mt1", topic:"Carbocation stability", type:"choice", difficulty:1, skills:["carbocation stability"], question:"For simple alkyl carbocations with no special resonance stabilization, which is generally most stable?", choices:["Tertiary","Secondary","Primary","Methyl"], answer:"Tertiary", hint:"Alkyl substitution stabilizes a simple carbocation.", explanation:"For simple alkyl carbocations, greater alkyl substitution generally stabilizes the positive charge: tertiary > secondary > primary > methyl." },
  { id:"sn1-heat", course:"mt1", topic:"SN1", type:"choice", difficulty:1, skills:["SN1","reaction classification"], question:"Under the supplied CHEM 233 convention, similar SN1/E1-compatible conditions without heat favor:", choices:["SN1","E1","SN2 only","No reaction"], answer:"SN1", hint:"In this course packet, heat is the explicit cue that shifts the competition toward E1.", explanation:"The supplied course rule uses heat as the E1 cue; similar conditions without heat favor SN1." },
  { id:"sn1-rearrange", course:"mt1", topic:"SN1", type:"choice", difficulty:2, skills:["SN1","carbocation stability"], question:"A carbocation could become more stable by a 1,2-shift. What does the CHEM 233 problem-set convention say?", choices:["Include the rearrangement because it is always required","Do not include carbocation rearrangements; they are not in play","Draw both rearranged and unrearranged products","Treat the shift as resonance"], answer:"Do not include carbocation rearrangements; they are not in play", hint:"This is an explicit course-specific rule in the supplied packet.", explanation:"The supplied CHEM 233 convention says carbocation rearrangements are not in play." },
  { id:"sn1-steps", course:"mt1", topic:"SN1 mechanism", type:"draw", difficulty:2, skills:["SN1","formal charge","mechanism steps"], question:"Draw the key steps for substitution of a tertiary alkyl bromide by methanol under SN1 conditions. Show the carbocation and charges.", hint:"Begin with leaving-group loss. Methanol is neutral; show what charge forms after it bonds to the carbocation.", rubric:"1. C–Br bond breaks and the bonding pair goes to Br, giving Br⁻ and a carbocation. 2. Neutral CH₃OH attacks the planar carbocation through an O lone pair, producing an oxonium intermediate. 3. A base removes an O–H proton to give the neutral ether. Show electron-pair arrows and formal charges.", explanation:"The course expects explicit carbocation formation, neutral-nucleophile attack, oxonium charge, and deprotonation." },
  { id:"e1-heat", course:"mt1", topic:"E1", type:"choice", difficulty:1, skills:["E1","reaction classification"], question:"For a substrate that can undergo either SN1 or E1 under the course's stated conditions, which cue favors E1?", choices:["Heat","A neutral nucleophile","A more substituted starting alkene","A resonance arrow"], answer:"Heat", hint:"Recall the specific competition rule from the supplied problem-set key.", explanation:"The course convention uses heat as the cue for E1 over SN1 when both pathways are available." },
  { id:"e1-product", course:"mt1", topic:"E1 selectivity", type:"choice", difficulty:2, skills:["E1","Zaitsev selectivity"], question:"When comparing possible E1 alkenes, what should you consider in addition to substitution?", choices:["Conjugation/resonance stabilization","Only the number of hydrogens on the leaving group","Whether the substrate was drawn as a wedge","The pKa of the alkene only"], answer:"Conjugation/resonance stabilization", hint:"The course packet notes a conjugated diene can beat an isolated alternative.", explanation:"Choose the more stable alkene, checking both Zaitsev substitution and conjugation/resonance stabilization." },
  { id:"zaitsev", course:"mt1", topic:"Zaitsev selectivity", type:"choice", difficulty:1, skills:["Zaitsev selectivity","E1"], question:"When otherwise comparable E1 eliminations can form alkenes of different substitution, which is generally favored by the course convention?", choices:["The more substituted alkene (Zaitsev product)","The less substituted alkene in every case","The alkene with more terminal hydrogens","No alkene product"], answer:"The more substituted alkene (Zaitsev product)", hint:"Use the course's default selectivity rule unless the problem indicates otherwise.", explanation:"The CHEM 233 packet says Zaitsev selectivity applies when possible and not otherwise indicated." },
  { id:"mechanism-arrows", course:"mt1", topic:"Curved-arrow mechanisms", type:"choice", difficulty:1, skills:["mechanism steps","curved-arrow mechanisms"], question:"A double-barbed curved arrow should begin at:", choices:["The electron source (lone pair, π bond, or breaking σ bond)","The atom that will receive electrons","The formal charge symbol","The reaction arrow"], answer:"The electron source (lone pair, π bond, or breaking σ bond)", hint:"Curved arrows track electron-pair movement, not atom movement.", explanation:"Arrows start where the electrons are: lone pairs, π bonds, or a breaking bond." },
  { id:"mechanism-proton", course:"mt1", topic:"Curved-arrow mechanisms", type:"choice", difficulty:2, skills:["mechanism steps","curved-arrow mechanisms","formal charge"], question:"During a proton-transfer step, which two electron movements are shown?", choices:["Base lone pair to H; H–A bond pair to A","A–H bond pair to H; H to base","Base lone pair to A; A–H bond to base","Two arrows from H to the base"], answer:"Base lone pair to H; H–A bond pair to A", hint:"The base forms a bond to the proton as the acid's bond electrons return to its conjugate base.", explanation:"Show the base's electron pair forming the new bond to H and the H–A sigma-bond pair moving onto A." },
  { id:"mechanism-resonance", course:"mt1", topic:"Mechanism completeness", type:"draw", difficulty:3, skills:["mechanism steps","drawing resonance contributors","formal charge"], question:"Draw the acid-catalyzed hydration sequence for propene. Show regiochemistry, charges, and the proton-transfer step; do not skip intermediates.", hint:"Choose protonation that gives the more substituted carbocation; water is neutral.", rubric:"1. Propene π bond takes H⁺ so the secondary carbocation forms at the middle carbon. 2. Neutral H₂O attacks that planar carbocation, forming an oxonium ion at the middle carbon. 3. A base removes a proton from O, with the O–H bond pair returning to oxygen, to give 2-propanol. Show formal charges and curved arrows in each step.", explanation:"The course requires the carbocation, neutral water attack, oxonium intermediate, and explicit deprotonation." },
  { id:"intramolecular", course:"mt1", topic:"Intramolecular cyclization", type:"choice", difficulty:2, skills:["intramolecular cyclization","carbocation stability"], question:"For a tethered carbocation and neutral O nucleophile, which ring sizes are usually favorable patterns in the supplied course examples?", choices:["Five- and six-membered rings","Only three-membered rings","Only four-membered rings","Every ring size is equally favorable"], answer:"Five- and six-membered rings", hint:"The packet specifically notes the preferred ring closures and a size usually avoided.", explanation:"Five- and six-membered closures are the commonly favorable patterns; four-membered rings are generally avoided in the examples." },
  { id:"text-acid", course:"mt1", topic:"Acid/base reasoning", type:"text", difficulty:2, skills:["acid-base equilibrium","pKa"], question:"An acid HA has pKa 7; HB has pKa 13. In HA + B⁻ ⇌ A⁻ + HB, which side is favored? Enter "left" or "right".", acceptedAnswers:["right"], hint:"The side containing the higher-pKa acid is favored.", explanation:"The right side contains HB, the weaker acid (higher pKa 13), so equilibrium favors the right." },
  { id:"text-cip", course:"mt1", topic:"CIP priority", type:"text", difficulty:2, skills:["CIP priority"], question:"For CIP comparison, how many oxygen atoms does a carbonyl carbon count as being attached to? Enter a number.", acceptedAnswers:["2","two"], hint:"Apply the duplicate-atom convention for a double bond.", explanation:"A carbonyl carbon counts as attached to two oxygen atoms for CIP comparison." },
  { id:"text-mechanism", course:"mt1", topic:"Mechanism completeness", type:"text", difficulty:2, skills:["mechanism steps","formal charge"], question:"Neutral water attacks a carbocation. What is the immediate charge on the attached oxygen? Enter +, positive, or oxonium.", acceptedAnswers:["+","positive","oxonium"], hint:"Count the oxygen's bonds before it loses a proton.", explanation:"The immediate adduct is oxonium, with a +1 charge on oxygen." },
  { id:"text-aromaticity", course:"mt1", topic:"Aromaticity", type:"text", difficulty:2, skills:["aromaticity"], question:"A planar, cyclic, continuously conjugated ring with 10 π electrons is aromatic, anti-aromatic, or nonaromatic? Enter one.", acceptedAnswers:["aromatic"], hint:"10 fits 4n + 2 for n = 2.", explanation:"Ten π electrons satisfy 4n + 2 with n = 2, so the ring is aromatic under the stated conditions." },
  { id:"text-course-trap", course:"mt1", topic:"Reaction classification", type:"text", difficulty:2, skills:["reaction classification","electrophilic alkene addition"], question:"Classify the reaction: an alkene treated with H₂SO₄ and ROH. Answer with the reaction family, not SN1/E1.", acceptedAnswers:["electrophilic alkene addition","alkene addition","electrophilic addition"], hint:"Identify the starting functional group first.", explanation:"This is electrophilic alkene addition (alcohol addition/solvation). The alcohol is a neutral nucleophile after carbocation formation." },
  { id:"draw-e1", course:"mt1", topic:"E1 mechanism", type:"draw", difficulty:2, skills:["E1","mechanism steps","curved-arrow mechanisms"], question:"On paper, draw the two key E1 steps for an alcohol-derived carbocation that can eliminate to form an alkene. Include all charges and arrows.", hint:"The leaving group departs first; a base then removes a β-H as the C–H electrons form π.", rubric:"1. Show leaving-group departure (for an alcohol, protonate OH first if required by conditions, then water leaves) and the carbocation. 2. A base removes a β-H; the C–H bond electrons form the C=C bond. For competing alkenes, evaluate substitution and conjugation. Show formal charges and every curved arrow.", explanation:"E1 is stepwise: carbocation formation, then beta deprotonation to form the alkene." },
  { id:"draw-rs", course:"mt1", topic:"R/S", type:"draw", difficulty:2, skills:["R/S","CIP priority"], question:"On paper, sketch a tetrahedral stereocenter with priorities 1, 2, 3, 4. Put 4 away and show the arrangement that is S.", hint:"With 4 away, 1 → 2 → 3 must run counterclockwise.", rubric:"Priority 4 points away; trace 1 → 2 → 3 counterclockwise. Any clear wedge/dash or tetrahedral sketch with this orientation earns the concept point.", explanation:"The descriptor is S when priority 4 points away and 1 → 2 → 3 is counterclockwise." },
  { id:"draw-ez", course:"mt1", topic:"E/Z", type:"draw", difficulty:2, skills:["E/Z"], question:"Draw an alkene whose higher-priority groups are on opposite sides, and label the geometry.", hint:"Opposite sides correspond to E.", rubric:"Show the higher-priority substituent on each alkene carbon on opposite sides of the C=C and label the alkene E.", explanation:"E geometry means the higher-priority groups are opposite." },
  { id:"busy-structure", course:"mt1", topic:"Structure interpretation", type:"choice", difficulty:3, skills:["functional groups","lone-pair orbitals","hybridization"], context:"Busy-molecule local scan:\nAtom A: carbonyl oxygen in an ester\nAtom B: ester single-bond oxygen\nAtom C: the ester carbonyl carbon", question:"Which local statement is correct?", choices:["A's lone pairs are in sp² hybrids; its p orbital participates in the carbonyl π bond","A is sp³ because it has two lone pairs","C has four electron domains and is sp³","B must donate both lone pairs into the ester carbonyl"], answer:"A's lone pairs are in sp² hybrids; its p orbital participates in the carbonyl π bond", hint:"Apply the specific carbonyl oxygen orbital convention from lecture.", explanation:"The carbonyl oxygen is sp²; its unhybridized p orbital participates in the π bond and its lone pairs occupy sp² hybrids." },
  { id:"busy-acetal", course:"mt1", topic:"Structure interpretation", type:"choice", difficulty:3, skills:["functional groups","stereocenter detection"], context:"Local structure: a carbon is bonded to H, CH₃, OCH₃, and OH. It came from an aldehyde-derived center.", question:"Using CHEM 233's terminology, how is this center classified?", choices:["Hemiacetal","Hemiketal","Acetal","Ketal"], answer:"Hemiacetal", hint:"Aldehyde-derived with one OR and one OH.", explanation:"An aldehyde-derived center with one OR and one OH is a hemiacetal under the stated convention." },
  { id:"select-ester-carbonyl", course:"mt1", topic:"Structure interpretation", type:"select-atom", difficulty:1, skills:["functional groups","structure interpretation"], question:"Select the atom that is the ester carbonyl carbon.", structure:{viewBox:"0 0 340 150",atoms:[{id:"A",label:"CH₃",x:38,y:78},{id:"B",label:"C",x:120,y:78},{id:"C",label:"O",x:120,y:24},{id:"D",label:"O",x:202,y:78},{id:"E",label:"CH₃",x:284,y:78}],bonds:[{from:"A",to:"B",order:1},{from:"B",to:"C",order:2},{from:"B",to:"D",order:1},{from:"D",to:"E",order:1}]}, answer:"B", hint:"Find the carbon double-bonded to oxygen and single-bonded to the ester oxygen.", explanation:"B is bonded to CH₃ at A, double-bonded to O at C, and single-bonded to ester O at D." },
  { id:"product-stereo-count", course:"mt1", topic:"Stereochemical product count", type:"choice", difficulty:3, skills:["stereochemical product count","stereocenter detection"], question:"A planar carbocation is attacked from either face, but the attacked carbon in the product has two identical substituents. How many distinct configurations at that carbon result?", choices:["One; that carbon is not stereogenic","Two enantiomers","Two diastereomers","Four"], answer:"One; that carbon is not stereogenic", hint:"A tetrahedral carbon needs four different groups to be stereogenic.", explanation:"The carbon has identical substituents, so facial attack does not create distinct configurations at that carbon." },
  { id:"pka-trap", course:"mt1", topic:"pKa recall", type:"choice", difficulty:2, skills:["pKa","ARIO: orbital"], question:"Which course-table value is closest to the pKa of a terminal alkyne?", choices:["−2","9","25","50"], answer:"25", hint:"The course pKa table lists the terminal alkyne between amide N–H and ketone α-H.", explanation:"The supplied course pKa table gives an approximate value of 25 for an alkyne." },
  { id:"resonance-arrows", course:"mt1", topic:"Resonance recognition", type:"choice", difficulty:2, skills:["resonance recognition","curved-arrow mechanisms"], question:"Which arrow should connect two resonance contributors?", choices:["A resonance arrow (↔), not an equilibrium arrow (⇌)","A forward reaction arrow","An equilibrium arrow only","A curved arrow between complete molecules"], answer:"A resonance arrow (↔), not an equilibrium arrow (⇌)", hint:"Resonance drawings represent one delocalized species, not an equilibrium mixture.", explanation:"Resonance contributors are linked with a resonance arrow. An equilibrium arrow would incorrectly imply separate interconverting species." },
  { id:"hydration-proton-source", course:"mt1", topic:"Acid-catalyzed hydration", type:"choice", difficulty:2, skills:["acid-catalyzed hydration/solvation","mechanism steps"], question:"Which mechanism feature should not be skipped when water attacks a carbocation?", choices:["The oxonium intermediate and its subsequent deprotonation","A hydride rearrangement","Formation of hydroxide in strongly acidic solution","A stereospecific backside attack"], answer:"The oxonium intermediate and its subsequent deprotonation", hint:"Water is neutral when it bonds to the carbocation.", explanation:"Neutral water attack forms an oxonium intermediate. Show its deprotonation to reach the neutral alcohol." },
  { id:"e1-conjugation", course:"mt1", topic:"E1 selectivity", type:"choice", difficulty:3, skills:["E1","Zaitsev selectivity"], question:"An E1 pathway can form a more substituted isolated alkene or a less substituted conjugated diene. What is the best course-aligned approach?", choices:["Compare overall alkene stability, including both substitution and conjugation","Always choose the more substituted alkene without exception","Always choose the conjugated product without checking anything else","Choose the product with the fewest atoms"], answer:"Compare overall alkene stability, including both substitution and conjugation", hint:"The packet explicitly warns that conjugation can outweigh a simple substitution comparison.", explanation:"Evaluate both Zaitsev substitution and conjugation/resonance; a conjugated diene may be favored over an isolated alkene." },
  { id:"protonation-pka", course:"mt1", topic:"pH and protonation", type:"choice", difficulty:2, skills:["pH/protonation states"], question:"For a protonatable group, if pH is below its pKa, which form predominates?", choices:["Protonated","Deprotonated","Exactly 50:50 at every lower pH","The answer cannot depend on pH"], answer:"Protonated", hint:"Below pKa means the solution is relatively more acidic than the group's midpoint.", explanation:"When pH < pKa, the protonated form predominates; when pH > pKa, the deprotonated form predominates." },
  { id:"aromatic-check", course:"mt1", topic:"Aromaticity", type:"choice", difficulty:3, skills:["aromaticity","lone-pair orbitals"], question:"A ring has 6 π electrons but one ring atom lacks a p orbital, interrupting conjugation. Based on the supplied test, is it aromatic?", choices:["No; it is not continuously conjugated","Yes; six electrons alone are sufficient","Yes; any ring with alternating bonds is aromatic","It is antiaromatic automatically"], answer:"No; it is not continuously conjugated", hint:"All three aromaticity conditions must be satisfied.", explanation:"Aromaticity requires planarity, continuous conjugation, and 4n+2 π electrons. The stated ring fails continuous conjugation." },
  { id:"arrow-source", course:"mt1", topic:"Curved-arrow mechanisms", type:"draw", difficulty:1, skills:["curved-arrow mechanisms","mechanism steps"], question:"On paper, draw the two curved arrows for deprotonation of a generic acid H–A by water. Begin both arrows at the electron source.", hint:"One arrow forms O–H; the other returns the H–A bond pair to A.", rubric:"Arrow 1 starts at a water oxygen lone pair and ends at H. Arrow 2 starts at the H–A sigma bond and ends at A. The result is H₃O⁺ and A⁻, with appropriate charges.", explanation:"Curved arrows show the source and destination of electron pairs, not atom movement." },
  { id:"sn1-vs-alkene", course:"mt1", topic:"Reaction classification", type:"choice", difficulty:3, skills:["reaction classification","SN1","electrophilic alkene addition"], question:"Which prompt describes electrophilic addition rather than SN1/E1?", choices:["An alkene plus acid and water","A tertiary alcohol plus acid and heat","An alkyl leaving group in a substitution/elimination setup","A carbocation formed by leaving-group departure"], answer:"An alkene plus acid and water", hint:"Start by identifying the substrate's functional group and the bond being formed.", explanation:"Alkene + acid + water is electrophilic addition. SN1/E1 are considered for alcohols or alkyl leaving groups under substitution/elimination conditions." }
];

function createPkaVariants() {
  const pkaLadder = [-7,-5,-3,-2,5,9,16,36];
  const pairs = [];
  for (const acidPka of pkaLadder) {
    for (const conjugateAcidPka of pkaLadder) {
      if (acidPka !== conjugateAcidPka) pairs.push([acidPka,conjugateAcidPka]);
    }
  }
  return shuffle(pairs).slice(0,28).map(([acidPka,conjugateAcidPka],index) => {
    const favored = conjugateAcidPka > acidPka ? "Right" : "Left";
    return {
      id:`pka-variation-${String(index+1).padStart(2,"0")}`,
      course:"mt1", topic:"Acid/base equilibrium", type:"choice", difficulty:1,
      skills:["acid-base equilibrium","pKa"],
      question:`For HA + B⁻ ⇌ A⁻ + HB, pKa(HA) = ${acidPka} and pKa(HB) = ${conjugateAcidPka}. Which side is favored?`,
      choices:["Left, because the reactant-side acid has the higher pKa","Right, because the product-side acid has the higher pKa","Neither; the two acids have equal strength","The values identify bases, not acids"],
      answer:`${favored}, because the ${favored==="Left"?"reactant-side":"product-side"} acid has the higher pKa`,
      hint:"Equilibrium favors the side containing the acid with the higher pKa.",
      explanation:`The ${favored.toLowerCase()} side contains the weaker acid (higher pKa), so equilibrium favors that side.`
    };
  });
}

questionBank.push(...createPkaVariants());

const shortAnswerKeys = {
  "acid-equilibrium-1":["right","products"],
  "acid-equilibrium-2":["products","toward products"],
  "ario-atom":["CH3S-","CH₃S⁻"],
  "resonance-vs-equilibrium":["resonance","resonance contributors"],
  "aromaticity-4":["aromatic"],
  "hybrid-domains":["sp2","sp²"],
  "functional-amide":["amide"],
  "functional-acetal":["acetal"],
  "formal-charge-oxonium":["positive","+","oxonium"],
  "rs-basic":["S"],
  "ez":["E"],
  "fischer":["toward","toward the viewer"],
  "alkene-class":["electrophilic alkene addition","electrophilic addition","alkene addition"],
  "carbocation":["tertiary","tertiary carbocation"],
  "sn1-heat":["SN1"],
  "e1-heat":["E1"]
};

for (const question of questionBank) {
  if (question.id.startsWith("pka-variation-")) {
    question.type = "text";
    question.acceptedAnswers = [question.answer.split(",")[0].toLowerCase()];
    delete question.choices;
  } else if (shortAnswerKeys[question.id]) {
    question.type = "text";
    question.acceptedAnswers = shortAnswerKeys[question.id];
    delete question.choices;
  }
}

const skillGroups = {
  "Structure & bonding": ["functional groups","formal charge","hybridization","lone-pair orbitals","aromaticity","structure interpretation"],
  "Acid / base": ["acid-base equilibrium","pKa","pH/protonation states","ARIO: atom","ARIO: resonance","ARIO: induction","ARIO: orbital","acid-base reasoning"],
  "Resonance": ["resonance recognition","drawing resonance contributors"],
  "Stereochemistry": ["stereocenter detection","CIP priority","R/S","E/Z","Fischer/Newman/wedge-dash conversion","isomer relationship classification","stereochemical product count"],
  "Reactions": ["carbocation stability","electrophilic alkene addition","Markovnikov regiochemistry","acid-catalyzed hydration/solvation","reaction classification","intramolecular cyclization","SN1","E1","Zaitsev selectivity","E1 selectivity"],
  "Mechanisms": ["mechanism steps","curved-arrow mechanisms","SN1 mechanism","E1 mechanism"]
};

const defaultState = () => ({
  version: SAVE_VERSION, xp: 0, level: 1, hearts: 3, streak: 0, lastStudyDate: null,
  attempts: 0, correct: 0, freeResponseScores: [], mastery: {},
  mistakes: {}, spacedRepetition: {}, bossResults: [], achievements: [],
  unlockedContent: ["mt1"], importedQuestions: [], sessionCount: 0,
  questionStats: {mechanismCorrect:0, stereoCorrect:0}, enemyProgress: {},
  courseMastery: {mt1:{}, mt2:{}, preview:{}}
});

let state = defaultState();
let activeSession = null;
let pausedSession = null;
let recoverySkills = [];
let selectedChoice = null;
let selectedAtom = null;
let selectedConfidence = 2;
let revealedHint = 0;
let committed = false;
let selectedRank = [];
let saveError = false;

const app = document.getElementById("app");
const saveStatus = document.getElementById("save-status");
let sessionTimer = null;

function escapeHtml(value) {
  return String(value ?? "").replace(/[&<>"']/g, character => ({
    "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;"
  })[character]);
}

function allQuestions() {
  return questionBank.concat(state.importedQuestions || []);
}

function confirmedQuestions(course) {
  return allQuestions().filter(q => q.course === course && (course !== "mt2" || q.courseSpecific === true));
}

function previewQuestions() {
  return allQuestions().filter(q => q.course === "mt2" && q.courseSpecific === false);
}

function questionText(question) {
  return [question.topic, question.question, question.context, question.type, ...(question.skills || []), ...(question.tags || [])].join(" ").toLowerCase();
}

function isProductionQuestion(question) {
  return ["text","draw","rank","select-atom"].includes(question.type) ||
    /\b(draw|predict|product|mechanism|classify|identify|construct|explain|write|rank|stereochem|regioselect|curved arrow|reaction class)\b/i.test(questionText(question));
}

function isMechanismQuestion(question) {
  return question.type === "draw" || /\b(mechanism|curved arrow|proton transfer|tetrahedral intermediate|cyclization|sn1|sn2|e1|e2)\b/i.test(questionText(question));
}

function isStereoQuestion(question) {
  return /\b(stereochem|stereocenter|cip|R\/S|E\/Z|fischer|newman|wedge|inversion|anti-periplanar|trans-diaxial|anomer)\b/i.test(questionText(question));
}

function questionPriority(question) {
  const review = state.spacedRepetition[question.id];
  const due = review?.dueDate && review.dueDate <= getToday();
  const mistakes = (question.skills || [question.topic]).reduce((sum, skill) => sum + (state.mistakes[skill]?.count || 0), 0);
  const weak = (question.skills || [question.topic]).reduce((sum, skill) => sum + (100 - skillScore(skill)), 0);
  const current = question.course === "mt2" && question.courseSpecific === true;
  return (due ? 1000 : 0) + mistakes * 80 + weak + (current ? 30 : 0) + (question.difficulty || 1) * 3 + Math.random();
}

function prioritized(ids, filter = () => true) {
  return shuffle(ids.map(getQuestion).filter(q => q && filter(q))).sort((a,b) => questionPriority(b) - questionPriority(a));
}

function masteryLabel(score) {
  if (score < 20) return "NEW";
  if (score < 40) return "LEARNING";
  if (score < 60) return "DEVELOPING";
  if (score < 80) return "RELIABLE";
  return "MASTERED";
}

function getToday() {
  const date = new Date();
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}

function readSave() {
  try {
    const raw = localStorage.getItem(SAVE_KEY);
    if (!raw) return defaultState();
    const loaded = JSON.parse(raw);
    return validateSave(loaded);
  } catch (error) {
    saveError = true;
    setTimeout(() => showStorageError(error.message), 0);
    return defaultState();
  }
}

function saveState(message = "Progress saved in this browser.") {
  try {
    localStorage.setItem(SAVE_KEY, JSON.stringify(state));
    saveError = false;
    saveStatus.textContent = message;
  } catch (error) {
    saveError = true;
    saveStatus.textContent = "Save failed: browser storage is unavailable or full.";
    console.error("Mechanism Quest could not save progress.", error);
  }
}

function showStorageError(message) {
  const box = document.getElementById("storage-error");
  if (box) box.innerHTML = `<div class="notice">Progress could not be loaded: ${escapeHtml(message)}. Your browser may have started a fresh save; your original file was not deleted.</div>`;
}

function getQuestion(id) {
  return allQuestions().find(question => question.id === id);
}

function questionIds(filter = () => true) {
  return allQuestions().filter(filter).map(question => question.id);
}

function shuffle(items) {
  const result = items.slice();
  for (let index = result.length - 1; index > 0; index--) {
    const other = Math.floor(Math.random() * (index + 1));
    [result[index], result[other]] = [result[other], result[index]];
  }
  return result;
}

function pickQuestions(ids, count) {
  return prioritized(ids).slice(0, Math.min(count, ids.length)).map(q => q.id);
}

function selectMixedQuestions(currentIds, maintenanceIds, count, currentRatio, required = []) {
  const current = prioritized(currentIds);
  const maintenance = prioritized(maintenanceIds);
  const selected = [];
  const add = q => {
    if (q && selected.length < count && !selected.some(item => item.id === q.id)) selected.push(q);
  };
  required.forEach(filter => add([...current, ...maintenance].find(filter)));
  const productionTarget = Math.min(count, Math.ceil(count*0.6));
  [...current,...maintenance].filter(isProductionQuestion).forEach(q => {
    if (selected.filter(isProductionQuestion).length < productionTarget) add(q);
  });
  const currentTarget = Math.min(count, Math.max(0, Math.round(count * currentRatio)));
  const currentSelected = current.filter(q => selected.includes(q)).length;
  current.slice(0, Math.max(0, currentTarget - currentSelected)).forEach(add);
  maintenance.filter(q => selected.includes(q)).forEach(add);
  if (selected.length < count) current.forEach(add);
  if (selected.length < count) maintenance.forEach(add);
  return shuffle(selected).map(q => q.id);
}

function startSession(mode, label, ids, count, boss = false, options = {}) {
  if (!ids.length) {
    app.innerHTML = `<section class="panel"><div class="eyebrow">No questions yet</div><h1>${escapeHtml(label)}</h1><p class="subtle">There are no playable questions in this module yet. Import a content pack when course materials are available.</p><button class="button secondary" data-action="home">Back to dashboard</button></section>`;
    return;
  }
  const today = getToday();
  if (state.lastStudyDate && state.lastStudyDate !== today) {
    const yesterday = new Date();
    yesterday.setDate(yesterday.getDate()-1);
    const yesterdayKey = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,"0")}-${String(yesterday.getDate()).padStart(2,"0")}`;
    if (state.lastStudyDate !== yesterdayKey) state.streak = 0;
    state.hearts = 3;
  }
  const queue = options.queue || pickQuestions(ids, count);
  activeSession = {
    mode, label, queue, index:0, answered:0, correct:0, boss,
    startedAt:new Date().toISOString(), startedAtMs:Date.now(),
    hintsUsed:0, combo:0, bestCombo:0, perfect:true, xpAtStart:state.xp,
    answers:{}, timerMinutes: options.timerMinutes || 0
  };
  selectedChoice = null; selectedAtom = null; selectedConfidence = 2; revealedHint = 0; committed = false; selectedRank = [];
  state.sessionCount += 1;
  if (mode === "exam" && activeSession.timerMinutes) {
    activeSession.deadline = Date.now() + activeSession.timerMinutes * 60000;
    sessionTimer = setInterval(updateExamTimer, 1000);
  }
  renderQuestion();
  saveState();
}

function readiness(course) {
  const qs = confirmedQuestions(course);
  const skills = [...new Set(qs.flatMap(q => q.skills || []))];
  if (!skills.length) return 0;
  const track = state.courseMastery?.[course] || {};
  const values = skills.map(skill => track[skill]?.score ?? (course === "mt1" ? state.mastery[skill]?.score : 0) ?? 0);
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function finalReadiness() {
  const mt1Skills = [...new Set(confirmedQuestions("mt1").flatMap(q => q.skills || []))];
  const mt2Skills = [...new Set(confirmedQuestions("mt2").flatMap(q => q.skills || []))];
  const entries = [
    ...mt1Skills.map(skill => state.courseMastery?.mt1?.[skill]?.score ?? state.mastery[skill]?.score ?? 0),
    ...mt2Skills.map(skill => state.courseMastery?.mt2?.[skill]?.score ?? 0)
  ];
  if (!entries.length) return 0;
  return Math.round(entries.reduce((sum, value) => sum + value, 0) / entries.length);
}

function allSkillNames() {
  return [...new Set([...Object.values(skillGroups).flat(), ...allQuestions().flatMap(q => q.skills || [])])].sort();
}

function skillScore(skill) {
  return Math.round(state.mastery[skill]?.score || 0);
}

function masteryAverage(skills) {
  const values = skills.filter(skill => state.mastery[skill]).map(skill => state.mastery[skill].score || 0);
  if (!values.length) return 0;
  return Math.round(values.reduce((sum, value) => sum + value, 0) / values.length);
}

function progressToNextLevel() {
  const next = Math.floor(state.xp / 100);
  return { level: next + 1, percent: state.xp % 100 };
}

function renderHome() {
  activeSession = null;
  const {level, percent} = progressToNextLevel();
  const mt1 = readiness("mt1");
  const mt2Ready = allQuestions().some(q => q.course === "mt2" && q.courseSpecific === true);
  const mt2 = mt2Ready ? readiness("mt2") : null;
  const finalExamReadiness = finalReadiness();
  const dueCount = Object.values(state.spacedRepetition).filter(item => item.dueDate && item.dueDate <= getToday()).length;
  const mistakes = Object.entries(state.mistakes).sort((a,b) => b[1].count-a[1].count).slice(0,4);
  const achievements = state.achievements.slice(-4);
  const m1Count = questionIds(q => q.course === "mt1").length;
  const mt2Count = questionIds(q => q.course === "mt2").length;
  const mt2Ids = questionIds(q => q.course === "mt2" && q.courseSpecific === true);
  const questButtons = [
    ["⚡","Quick Quest","5 mixed questions","quick"],
    ["⌂","Midterm 1 Review","10 archive questions","mt1"],
    ["♜","Midterm 1 Boss","6-question skill check","m1boss"],
    ["⟷","Mechanism Grind","Arrows, steps & charges","mechanism"],
    ["◈","Product Grind","Regioselectivity & products","product"],
    ["✧","Stereo Grind","CIP, R/S, E/Z & isomers","stereo"],
    ["◎","Visual Grind","Structure reading skills","visual"],
    ["⌕","Weakness Hunt","Target missed and weak skills","weakness"],
    ["♛","Boss Battle","8-question challenge","boss"],
    ["◷","Exam Mode","15 questions, no hints needed","exam"],
    ["✦","Final Exam Review","Cumulative review from unlocked content","final"]
  ];
  app.innerHTML = `
    <div id="storage-error"></div>
    <section class="hero">
      <div class="hero-copy">
        <div class="eyebrow">Your study campaign · saved on this device</div>
        <h1>CHEM 233: Mechanism Quest</h1>
        <p class="subtle">Build exam-ready chemistry one committed answer at a time. Your progress stays in this browser—no login, profile, or API key.</p>
      </div>
      <div class="level-box">
        <div class="level">LEVEL ${level} <span class="muted">· ${state.xp} XP total</span></div>
        <div class="xp-line"><div class="xp-fill" style="width:${percent}%"></div></div>
        <div class="muted mono" style="font-size:9px;margin-top:6px">${percent}/100 XP to level ${level+1}</div>
      </div>
    </section>

    <section class="stat-grid" aria-label="Study stats">
      <div class="stat-card"><span class="stat-label">🔥 Study streak</span><span class="stat-value">${state.streak}</span><span class="stat-note">days</span></div>
      <div class="stat-card"><span class="stat-label">❤️ Hearts</span><span class="stat-value">${state.hearts}</span><span class="stat-note">refill tomorrow</span></div>
      <div class="stat-card"><span class="stat-label">Midterm 2 readiness</span><span class="stat-value">${mt2 === null ? "—" : `${mt2}%`}</span><span class="stat-note">${mt2 === null ? "awaiting course material" : "confirmed content only"}</span></div>
      <div class="stat-card"><span class="stat-label">Final exam readiness</span><span class="stat-value">${finalExamReadiness}%</span><span class="stat-note">${mt2Ready ? "all confirmed material" : "currently MT1-based"}</span></div>
    </section>

    <div class="dashboard-grid">
      <section class="panel">
        <div class="section-heading"><h2>Today's quest</h2><span class="tag live">${dueCount ? `${dueCount} reviews due` : "ready when you are"}</span></div>
        <div class="daily-card">
          <div class="eyebrow">Daily quest · about 15 minutes</div>
          <h3 style="margin:8px 0">Recall. Reason. Draw.</h3>
          <p>${mt2Ready ? "Mixed current Midterm 2 and maintenance questions, with extra weight for review items due today. " : "Eight mixed Midterm 1 questions, with extra weight for review items due today. "}Commit before hints; your responses update mastery and spaced repetition.</p>
          <button class="button primary" data-action="daily">Start daily quest <span aria-hidden="true">→</span></button>
        </div>
        <div class="quest-grid">
          ${questButtons.map(([icon,title,description,action]) => `<button class="quest-card" data-action="${action}" type="button"><span class="quest-icon" aria-hidden="true">${icon}</span><strong>${title}</strong><small>${description}</small></button>`).join("")}
          <button class="quest-card" data-action="mt2" type="button" ${mt2Count ? "" : "disabled"}><span class="quest-icon" aria-hidden="true">${mt2Count ? "◌" : "🔒"}</span><strong>Midterm 2 Review</strong><small>${mt2Count ? `${mt2Count} imported questions` : "Awaiting your course files"}</small></button>
          ${previewQuestions().length ? `<button class="quest-card" data-action="ahead"><span class="quest-icon" aria-hidden="true">🔮</span><strong>Ahead of Class</strong><small>Preview material for future topics</small></button>` : ""}
        </div>
      </section>

      <section class="panel">
        <div class="section-heading"><h2>Mastery map</h2><span class="tag">${m1Count} built-in questions</span></div>
        ${Object.entries(skillGroups).map(([group,skills]) => {
          const score = masteryAverage(skills);
          return `<div class="mastery-row"><div class="mastery-label"><span>${escapeHtml(group)}</span><span class="readiness">${score}%</span></div><div class="progress-track"><div class="progress-fill" style="width:${score}%"></div></div></div>`;
        }).join("")}
        ${!mt2Ready ? `<div class="locked-panel"><span>🔒</span><span><strong>Midterm 2 campaign</strong><br>Known topics: SN2, E2, carbonyl additions, carbohydrates, and nucleophilic acyl substitution. Awaiting your course materials before course-specific drills unlock.</span></div>` : `<div class="locked-panel"><span>✓</span><span><strong>Midterm 2 campaign active</strong><br>${mt2Ids.length} confirmed questions available. Focus practice on current material with MT1 maintenance review.</span></div>`}
        <p class="tip-box">Exam transfer matters: practice scores alone don't create mastery. Drawing prompts and unfamiliar combinations count toward your readiness too.</p>
      </section>
    </div>

    <div class="bottom-grid">
      <section class="panel">
        <div class="section-heading"><h2>Enemy database</h2><span class="tag">${mistakes.reduce((sum,item)=>sum+item[1].count,0)} logged misses</span></div>
        ${mistakes.length ? `<ul class="list-clean">${mistakes.map(([skill,item]) => `<li class="mistake-line"><span>${escapeHtml(skill)}</span><span>${item.count} miss${item.count===1?"":"es"}</span></li>`).join("")}</ul>` : `<div class="empty-state">No recurring mistakes logged yet. Missed or partially correct questions will appear here.</div>`}
      </section>
      <section class="panel">
        <div class="section-heading"><h2>Campaign record</h2><span class="tag">${state.attempts} attempts</span></div>
        <div class="muted" style="font-size:12px;line-height:1.8">${state.correct} correct · ${state.attempts ? Math.round(state.correct/state.attempts*100) : 0}% accuracy<br>${state.freeResponseScores.length} free-response scores · ${state.bossResults.length} boss results<br>Last study: ${state.lastStudyDate || "not started yet"}</div>
        ${achievements.length ? `<div style="margin-top:12px">${achievements.map(item=>`<span class="achievement">${escapeHtml(item)}</span>`).join("")}</div>` : ""}
      </section>
    </div>
    <div class="tools-row">
      <button class="button secondary small" data-action="export">Export save</button>
      <button class="button secondary small" data-action="import">Import save / content pack</button>
      <button class="button secondary small" data-action="stats">Full stats</button>
      <button class="button danger small" data-action="reset">Reset progress</button>
    </div>`;
  if (saveError) showStorageError("Browser storage could not be read.");
}

function setSessionConfidence(confidence) {
  selectedConfidence = confidence;
  document.querySelectorAll(".confidence-choice").forEach(button => button.classList.toggle("selected", Number(button.dataset.confidence) === confidence));
}

function renderQuestion() {
  if (!activeSession) return renderHome();
  if (activeSession.index >= activeSession.queue.length) return finishSession();
  const question = getQuestion(activeSession.queue[activeSession.index]);
  if (!question) {
    activeSession.queue.splice(activeSession.index, 1);
    return renderQuestion();
  }
  if (question.type === "rank" && selectedRank.length === 0) selectedRank = shuffle(question.items);
  const index = activeSession.index + 1;
  const total = activeSession.queue.length;
  const percent = Math.round((index-1)/total*100);
  const sessionCorrect = activeSession.correct;
  const bossHealth = Math.max(0, Math.round(((total - sessionCorrect) / total) * 100));
  app.innerHTML = `
    <div class="session-head">
      <div><div class="eyebrow">${escapeHtml(activeSession.label)} ${activeSession.boss ? "· BOSS ENCOUNTER" : ""}</div><h1>${escapeHtml(question.topic)}</h1></div>
      <div class="session-progress"><span>${index}/${total}</span><div class="progress-track"><div class="progress-fill" style="width:${percent}%"></div></div></div>
    </div>
    ${activeSession.boss ? `<div class="boss-bar-wrap" aria-label="Boss health"><div class="boss-bar" style="width:${bossHealth}%"></div></div>` : ""}
    <article class="question-card">
      <div class="question-meta"><span class="tag">${question.type === "draw" ? "PAPER / TABLET" : question.type === "rank" ? "RANKING" : question.type === "text" ? "FREE RESPONSE" : question.type === "select-atom" ? "SELECT AN ATOM" : "QUESTION"}</span><span class="tag">Difficulty ${escapeHtml(question.difficulty || 1)}</span></div>
      ${question.context ? `<div class="question-context">${escapeHtml(question.context)}</div>` : ""}
      <div class="question-text">${escapeHtml(question.question)}</div>
      ${question.type === "select-atom" ? renderStructure(question) : ""}
      ${question.type === "choice" ? renderChoices(question) : ""}
      ${question.type === "text" ? `<label class="muted" for="answer-input" style="font-size:11px">Your answer</label><input class="answer-input" id="answer-input" type="text" autocomplete="off" placeholder="Commit to an answer before checking">` : ""}
      ${question.type === "rank" ? renderRank(question) : ""}
      ${question.type === "draw" ? `<div class="notice">Draw this on paper or a tablet before revealing the rubric. Show bonds, arrows, formal charges, and stereochemistry when requested.</div>` : ""}
      <div class="confidence-row" aria-label="Confidence rating"><span>How confident are you?</span>${[["1","Guessing"],["2","Somewhat"],["3","Confident"]].map(([value,label])=>`<button class="confidence-choice ${Number(value)===selectedConfidence?"selected":""}" data-confidence="${value}" type="button">${label}</button>`).join("")}</div>
      ${activeSession.mode !== "exam" && revealedHint >= 1 && question.hint ? `<div class="feedback hint"><strong>Hint 1</strong><span style="font-size:0.9em">${escapeHtml(typeof question.hint === "string" ? question.hint : (question.hints && question.hints[0]) || question.hint)}</span></div>` : ""}
      ${activeSession.mode !== "exam" && revealedHint >= 2 && question.hints && question.hints[1] ? `<div class="feedback hint"><strong>Hint 2</strong><span style="font-size:0.9em">${escapeHtml(question.hints[1])}</span></div>` : ""}
      ${activeSession.mode !== "exam" && revealedHint >= 3 && question.hints && question.hints[2] ? `<div class="feedback hint"><strong>Hint 3</strong><span style="font-size:0.9em">${escapeHtml(question.hints[2])}</span></div>` : ""}
      ${activeSession.mode !== "exam" && committed ? renderFeedback(question) : ""}
      <div class="question-actions">
        ${!committed ? `<button class="button primary" data-action="${question.type==="draw"?"reveal-rubric":(activeSession.mode==="exam"?"exam-next":"check-answer")}" type="button">${question.type==="draw"?"Show answer / rubric":(activeSession.mode==="exam"?"Next question":"Commit answer")}</button>` : ""}
        ${committed && question.type==="draw" && !activeSession.lastOutcome ? assessmentButtons() : ""}
        ${activeSession.mode !== "exam" ? `<button class="button secondary small" data-action="hint" type="button" ${(() => { const maxHints = question.hints ? 3 : (question.hint ? 1 : 0); return revealedHint >= maxHints ? "disabled" : ""; })()}>${revealedHint >= (question.hints ? 3 : (question.hint ? 1 : 0)) ? "All hints shown" : `Hint ${revealedHint + 1}`}</button>` : ""}
        ${activeSession.mode === "exam" ? `<span class="exam-timer" style="font-size:14px"></span>` : ""}
        ${committed && activeSession.lastOutcome ? `<span class="spacer"></span><button class="button primary" data-action="next" type="button">${index === total ? "Finish quest" : "Next question →"}</button>` : ""}
        <span class="spacer"></span><button class="quiet-button" data-action="home" type="button">Leave quest</button>
      </div>
    </article>`;
  if (committed) {
    document.querySelectorAll(".confidence-choice").forEach(button => button.disabled = true);
  }
  if (activeSession.lastOutcome) {
    const selected = document.querySelector(`.choice[data-choice="${CSS.escape(String(selectedChoice))}"]`);
    if (selected && question.type === "choice") selected.classList.add(activeSession.lastOutcome.correct ? "correct" : "incorrect");
  }
}

function renderChoices(question) {
  const choices = shuffle(question.choices);
  return `<div class="choices">${choices.map((choice,index)=>`<button class="choice" data-choice="${escapeHtml(choice)}" type="button"><span class="choice-letter">${String.fromCharCode(65+index)}</span><span>${escapeHtml(choice)}</span></button>`).join("")}</div>`;
}

function renderRank(question) {
  return `<div class="rank-list">${selectedRank.map((item,index)=>`<div class="rank-item"><span><span class="rank-index">${index+1}</span>${escapeHtml(item)}</span><button type="button" data-rank="up" data-index="${index}" aria-label="Move up" ${index===0?"disabled":""}>↑</button><button type="button" data-rank="down" data-index="${index}" aria-label="Move down" ${index===selectedRank.length-1?"disabled":""}>↓</button></div>`).join("")}</div><div class="muted" style="font-size:10px">Use ↑ and ↓ to order from lowest / least to highest / most as requested.</div>`;
}

function renderStructure(question) {
  const structure = question.structure;
  const atoms = new Map(structure.atoms.map(atom=>[atom.id,atom]));
  const bonds = structure.bonds.map(bond => {
    const from = atoms.get(bond.from);
    const to = atoms.get(bond.to);
    if (!from || !to) return "";
    const dx = to.x-from.x;
    const dy = to.y-from.y;
    const length = Math.hypot(dx,dy) || 1;
    const offsetX = -dy/length*3;
    const offsetY = dx/length*3;
    const doubleLines = bond.order===2
      ? `<line x1="${from.x+offsetX}" y1="${from.y+offsetY}" x2="${to.x+offsetX}" y2="${to.y+offsetY}"></line><line x1="${from.x-offsetX}" y1="${from.y-offsetY}" x2="${to.x-offsetX}" y2="${to.y-offsetY}"></line>`
      : `<line x1="${from.x}" y1="${from.y}" x2="${to.x}" y2="${to.y}"></line>`;
    return `<g class="structure-bond">${doubleLines}</g>`;
  }).join("");
  return `<figure class="structure-figure"><svg class="structure-svg" viewBox="${escapeHtml(structure.viewBox || "0 0 340 150")}" role="group" aria-label="Select an atom in the displayed structure">${bonds}${structure.atoms.map(atom=>`<g class="atom-node ${selectedAtom===atom.id?"selected":""} ${committed&&activeSession.lastOutcome&&activeSession.lastOutcome.correct&&question.answer===atom.id?"correct":""}" data-atom="${escapeHtml(atom.id)}" role="button" aria-label="Atom ${escapeHtml(atom.id)}: ${escapeHtml(atom.label)}" aria-pressed="${selectedAtom===atom.id}" tabindex="0"><circle cx="${atom.x}" cy="${atom.y}" r="20"></circle><text class="atom-label" x="${atom.x}" y="${atom.y}">${escapeHtml(atom.label)}</text><text class="atom-id" x="${atom.x}" y="${atom.y+34}">${escapeHtml(atom.id)}</text></g>`).join("")}</svg><figcaption>Tap or click an atom. The labels are included to make the structure readable on small screens.</figcaption></figure>`;
}

function renderFeedback(question) {
  const outcome = activeSession.lastOutcome;
  if (!outcome) {
    return question.type === "draw" ? `<div class="rubric"><strong>Answer / rubric</strong><br>${escapeHtml(question.rubric || question.explanation)}</div>` : "";
  }
  const answerHtml = question.type === "draw"
    ? `<div class="rubric"><strong>Answer / rubric</strong><br>${escapeHtml(question.rubric || question.explanation)}</div>`
    : "";
  return `<div class="feedback ${outcome.correct?"good":"bad"}"><strong>${outcome.correct?"Correct — good retrieval.":outcome.label}</strong>${escapeHtml(outcome.message || question.explanation)}</div>${answerHtml}`;
}

function assessmentButtons() {
  return `<button class="button primary small" data-assessment="correct" type="button">I got it correct</button><button class="button secondary small" data-assessment="minor" type="button">Minor mistake</button><button class="button secondary small" data-assessment="major" type="button">Major mistake</button><button class="button danger small" data-assessment="stuck" type="button">I was completely stuck</button>`;
}

function normalizeAnswer(value) {
  return String(value ?? "").trim().toLowerCase().replace(/[.,!?;:]/g,"").replace(/\s+/g," ");
}

function checkAnswer() {
  if (!activeSession || committed) return;
  const question = getQuestion(activeSession.queue[activeSession.index]);
  let isCorrect = false;
  let supplied = "";
  if (question.type === "choice") {
    if (selectedChoice === null) return alert("Choose an answer before committing.");
    supplied = selectedChoice;
    isCorrect = normalizeAnswer(supplied) === normalizeAnswer(question.answer);
  } else if (question.type === "rank") {
    isCorrect = selectedRank.length === question.answer.length && selectedRank.every((item,index)=>item===question.answer[index]);
    supplied = selectedRank.join(" → ");
  } else if (question.type === "text") {
    supplied = document.getElementById("answer-input").value;
    if (!supplied.trim()) return alert("Enter an answer before committing.");
    isCorrect = (question.acceptedAnswers || []).some(answer=>normalizeAnswer(answer)===normalizeAnswer(supplied));
  } else if (question.type === "select-atom") {
    if (!selectedAtom) return alert("Select an atom before committing.");
    supplied = `Atom ${selectedAtom}`;
    isCorrect = selectedAtom === question.answer;
  }
  if (activeSession.mode === "exam") {
    activeSession.answers[question.id] = {correct: isCorrect, severity: isCorrect ? "correct" : "major", supplied, confidence: selectedConfidence, hintsUsed: revealedHint};
    return advanceExam();
  }
  commitOutcome(question, isCorrect, isCorrect ? "correct" : "major", supplied);
}

function revealRubric() {
  if (!activeSession || committed) return;
  committed = true;
  activeSession.lastOutcome = null;
  renderQuestion();
  const answer = document.querySelector(".rubric");
  if (answer) answer.scrollIntoView({behavior:"smooth", block:"nearest"});
}

function commitOutcome(question, correct, severity, supplied = "") {
  committed = true;
  const confidence = selectedConfidence;
  const wasCorrect = correct;
  const label = wasCorrect ? "Correct — good retrieval." :
    severity === "minor" ? "Minor mistake — review the detail." :
    severity === "major" ? "Major mistake — let's repair the concept." : "Stuck — this skill is queued for early review.";
  let xp = wasCorrect ? 12 + Math.max(0, (question.difficulty || 1)-1)*2 : severity === "minor" ? 4 : 1;
  if (question.type === "draw" && wasCorrect) xp += 6;

  // Apply XP penalty for hints used
  if (revealedHint >= 1) xp -= 2;
  if (revealedHint >= 2) xp -= 3;
  if (revealedHint >= 3) xp -= 5;
  xp = Math.max(1, xp); // Never negative

  state.xp += xp;
  state.level = Math.floor(state.xp/100)+1;
  state.attempts += 1;
  if (wasCorrect) state.correct += 1;

  // Track mechanism/stereo questions
  if (wasCorrect) {
    if (isMechanismQuestion(question)) state.questionStats.mechanismCorrect += 1;
    if (isStereoQuestion(question)) state.questionStats.stereoCorrect += 1;
  }

  if (question.type === "text" || question.type === "draw") state.freeResponseScores.push({
    questionId:question.id, score:wasCorrect?1:severity==="minor"?0.5:0, confidence, date:getToday()
  });
  state.freeResponseScores = state.freeResponseScores.slice(-300);
  if (state.lastStudyDate !== getToday()) {
    if (!state.lastStudyDate) state.streak = 1;
    else {
      const yesterday = new Date(); yesterday.setDate(yesterday.getDate()-1);
      const key = `${yesterday.getFullYear()}-${String(yesterday.getMonth()+1).padStart(2,"0")}-${String(yesterday.getDate()).padStart(2,"0")}`;
      state.streak = state.lastStudyDate === key ? state.streak+1 : 1;
    }
    state.lastStudyDate = getToday();
  }
  const previousHearts = state.hearts;
  if (!wasCorrect && severity !== "minor") state.hearts = Math.max(0, state.hearts-1);

  // Update combo
  if (wasCorrect) {
    activeSession.combo = (activeSession.combo || 0) + 1;
    activeSession.bestCombo = Math.max(activeSession.bestCombo || 0, activeSession.combo);
  } else {
    activeSession.combo = 0;
    activeSession.perfect = false;
  }
  if (revealedHint > 0) activeSession.combo = Math.max(0, (activeSession.combo || 0) - 1);

  const masteryKeys = [...new Set([question.topic,...(question.skills || [])])];
  const courseTrack = question.course === "mt2" && question.courseSpecific ? "mt2" : question.course === "mt2" && !question.courseSpecific ? "preview" : "mt1";
  for (const key of masteryKeys) {
    const previous = state.mastery[key]?.score || 0;
    const score = wasCorrect ? Math.min(100, previous * .75 + 25) :
      severity === "minor" ? Math.max(0,previous*.75+12) :
      Math.max(0,previous*.65);
    state.mastery[key] = {
      score:Math.round(score),
      attempts:(state.mastery[key]?.attempts || 0)+1,
      correct:(state.mastery[key]?.correct || 0)+(wasCorrect?1:0),
      lastSeen:getToday()
    };
    // Also update course-specific mastery tracking
    if (!state.courseMastery[courseTrack]) state.courseMastery[courseTrack] = {};
    state.courseMastery[courseTrack][key] = state.mastery[key];
  }
  const interval = wasCorrect ? (confidence===3?7:confidence===2?4:2) : severity==="minor"?2:1;
  state.spacedRepetition[question.id] = {
    dueDate:dateAfter(interval), interval,
    repetitions:wasCorrect?(state.spacedRepetition[question.id]?.repetitions||0)+1:0,
    lastResult:wasCorrect?"correct":severity
  };
  if (!wasCorrect) {
    for (const skill of question.skills || [question.topic]) {
      state.mistakes[skill] = {count:(state.mistakes[skill]?.count||0)+1,lastQuestion:question.id,lastDate:getToday()};
    }
  }
  activeSession.answered += 1;
  if (wasCorrect) activeSession.correct += 1;
  activeSession.lastOutcome = {
    correct:wasCorrect, label,
    message: wasCorrect ? question.explanation : `${question.explanation}${supplied ? ` Your response: "${supplied}".` : ""}`,
    severity, xp
  };
  if (previousHearts > state.hearts && activeSession.mode !== "exam") activeSession.heartLost = true;

  awardAchievements();
  saveState();

  // Check for recovery battle trigger
  if (state.hearts === 0 && activeSession.mode !== "exam" && activeSession.mode !== "recovery") {
    pausedSession = activeSession;
    recoverySkills = question.skills || [question.topic];
    return startByAction("recovery");
  }

  renderQuestion();
}

function dateAfter(days) {
  const date = new Date();
  date.setDate(date.getDate()+days);
  return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,"0")}-${String(date.getDate()).padStart(2,"0")}`;
}

function awardAchievements() {
  const earned = new Set(state.achievements);
  const checks = [
    [state.attempts>=1,"First bond"],
    [state.questionStats.mechanismCorrect>=5,"Arrow Sniper"],
    [state.questionStats.mechanismCorrect>=10,"Mechanism Machine"],
    [state.questionStats.stereoCorrect>=10,"Stereo Survivor"],
    [state.streak>=3,"Three-day streak"],
    [state.streak>=7,"One-week practice"],
    [state.bossResults.length>=1,"Boss Challenger"],
    [state.bossResults.some(r=>r.percent>=80),"Boss Slayer"]
  ];
  checks.forEach(([condition,name])=>{if(condition) earned.add(name);});
  state.achievements = [...earned];
}

function updateExamTimer() {
  if (!activeSession || activeSession.mode !== "exam" || !activeSession.deadline) return;
  const remaining = activeSession.deadline - Date.now();
  const minutes = Math.ceil(remaining/60000);
  const timerDisplay = document.querySelector(".exam-timer");
  if (timerDisplay) timerDisplay.textContent = `${minutes}m`;
  if (remaining <= 0) {
    if (sessionTimer) clearInterval(sessionTimer);
    submitExam();
  }
}

function finishSession() {
  const session = activeSession;
  if (sessionTimer) clearInterval(sessionTimer);
  sessionTimer = null;

  if (session.mode === "recovery") {
    state.hearts = Math.max(1, state.hearts);
    activeSession = pausedSession;
    pausedSession = null;
    recoverySkills = [];
    saveState();
    if (activeSession && activeSession.index < activeSession.queue.length) {
      activeSession.index += 1;
      selectedChoice = null;
      selectedAtom = null;
      selectedRank = [];
      selectedConfidence = 2;
      revealedHint = 0;
      committed = false;
      renderQuestion();
    } else {
      finishSession();
    }
    return;
  }

  if (session.mode === "exam") return renderExamReport(session);

  const percent = session.answered ? Math.round(session.correct/session.answered*100) : 0;
  const result = { mode:session.mode, label:session.label, date:getToday(), correct:session.correct, total:session.answered, percent, hintsUsed:session.hintsUsed||0, bestCombo:session.bestCombo||0 };
  if (session.boss) {
    state.bossResults.push(result);
    state.bossResults = state.bossResults.slice(-50);
    if (!session.hintsUsed) state.achievements.push("No Hint Needed");
    awardAchievements();
  }
  if (session.answered && session.correct===session.answered && !session.hintsUsed) {
    state.xp += 25;
    state.level = Math.floor(state.xp/100)+1;
    state.achievements.push("Perfect Run");
  }
  activeSession = null;
  saveState();
  const xpEarned = Math.max(0, state.xp - session.xpAtStart);
  const topSkill = Object.entries(state.mastery).sort((a,b)=>b[1].score-a[1].score)[0]?.[0];
  const nextThreat = Object.entries(state.mistakes).sort((a,b)=>b[1].count-a[1].count)[0]?.[0];
  app.innerHTML = `
    <section class="result-banner">
      <div class="eyebrow">Daily chest · run complete</div>
      <h2>${escapeHtml(session.label)}</h2>
      <div class="result-score">${percent}%</div>
      <p class="subtle">${session.correct} correct of ${session.answered} attempted · +${xpEarned} XP · peak combo x${session.bestCombo||0} · ${state.hearts} hearts · ${state.streak}-day streak</p>
      <p class="muted" style="font-size:12px">Missed skills are queued for spaced review. Practice scores are not proof of mastery.</p>
      <div class="tools-row" style="justify-content:center"><button class="button primary" data-action="daily">Run another quest</button><button class="button secondary" data-action="stats">See full stats</button><button class="button secondary" data-action="home">Dashboard</button></div>
    </section>`;
}

function recordExamDraw(severity) {
  if (!activeSession || activeSession.mode !== "exam") return;
  const question = getQuestion(activeSession.queue[activeSession.index]);
  const correct = severity === "correct";
  activeSession.answers[question.id] = {correct, severity, supplied: "Self-assessed", confidence: 2, hintsUsed: 0};
  if (activeSession.index === activeSession.queue.length - 1) return submitExam();
  advanceExam();
}

function advanceExam() {
  if (!activeSession || activeSession.mode !== "exam") return;
  if (activeSession.index === activeSession.queue.length - 1) return submitExam();
  activeSession.index += 1;
  selectedChoice = null; selectedAtom = null; selectedRank = []; selectedConfidence = 2;
  revealedHint = 0; committed = false;
  renderQuestion();
}

function submitExam() {
  if (!activeSession || activeSession.mode !== "exam") return;
  const session = activeSession;
  if (sessionTimer) clearInterval(sessionTimer);
  sessionTimer = null;
  session.results = [];
  session.queue.forEach(id => {
    const question = getQuestion(id);
    const answer = session.answers[id] || {correct: false, severity: "major", supplied: "No answer submitted", confidence: 2, hintsUsed: 0};
    session.results.push({question, answer});
    session.answered += 1;
    if (answer.correct) session.correct += 1;
  });
  session.elapsedMs = Date.now() - (session.startedAtMs || Date.now());
  awardAchievements();
  saveState();
  renderExamReport(session);
}

function renderExamReport(session) {
  activeSession = null;
  const total = session.results?.length || session.answered;
  const correct = session.correct || 0;
  const percent = total ? Math.round(correct / total * 100) : 0;
  const rows = session.results || [];
  const accuracy = subset => {
    const selected = rows.filter(({question}) => subset(question));
    return selected.length ? `${Math.round(selected.filter(({answer}) => answer.correct).length / selected.length * 100)}% (${selected.filter(({answer}) => answer.correct).length}/${selected.length})` : "—";
  };
  const skillResults = {};
  rows.forEach(({question, answer}) => (question.skills || [question.topic]).forEach(skill => {
    if (!skillResults[skill]) skillResults[skill] = {correct: 0, total: 0};
    skillResults[skill].total += 1;
    if (answer.correct) skillResults[skill].correct += 1;
  }));
  const sortedSkills = Object.entries(skillResults).sort((a, b) => (b[1].correct / b[1].total) - (a[1].correct / a[1].total));
  const weak = sortedSkills.slice(-3).reverse().map(([skill]) => skill);
  const strong = sortedSkills.slice(0, 3).map(([skill]) => skill);
  app.innerHTML = `
    <section class="result-banner">
      <div class="eyebrow">Exam complete</div>
      <h2>Final Report</h2>
      <div class="result-score">${percent}%</div>
      <p class="subtle">${correct}/${total} correct · time: ${Math.round(session.elapsedMs/60000)}m</p>
      <div style="margin:16px 0"><strong>Weakest areas</strong><ul style="margin:8px 0;padding-left:20px">${weak.map(s=>`<li>${escapeHtml(s)}</li>`).join("")}</ul><strong>Strongest areas</strong><ul style="margin:8px 0;padding-left:20px">${strong.map(s=>`<li>${escapeHtml(s)}</li>`).join("")}</ul></div>
      <p class="muted" style="font-size:12px">This exam report provides feedback only. Real exam performance depends on timing, pressure, and many factors beyond practice scores.</p>
      <div class="tools-row" style="justify-content:center"><button class="button primary" data-action="home">Return to dashboard</button><button class="button secondary" data-action="stats">Full stats</button></div>
    </section>`;
}

function startByAction(action) {
  const mt1Ids = questionIds(q=>q.course==="mt1");
  const mt2Ids = questionIds(q=>q.course==="mt2" && q.courseSpecific===true);
  const previewIds = questionIds(q=>q.course==="mt2" && !q.courseSpecific);
  const importedIds = questionIds(q=>q.course==="mt2");
  const confirmedAllIds = questionIds(q=>q.course==="mt1" || (q.course==="mt2"&&q.courseSpecific===true));
  const dueIds = questionIds(q=>(state.spacedRepetition[q.id]?.dueDate||"")<=getToday() && state.spacedRepetition[q.id]?.dueDate);
  const masteryWeak = Object.entries(state.mastery).sort((a,b)=>(a[1].score||0)-(b[1].score||0)).slice(0,5).map(([topic])=>topic);
  const mistakeSkills = Object.keys(state.mistakes);
  const allConfirmed = confirmedAllIds.length;
  const weaknessIds = dueIds.length ? dueIds : questionIds(q=> {
    const isConfirmed = q.course==="mt1" || (q.course==="mt2"&&q.courseSpecific===true);
    return isConfirmed && (q.skills||[]).some(skill=>mistakeSkills.includes(skill)||masteryWeak.includes(skill)||masteryWeak.includes(q.topic));
  });

  const mechanismIds = questionIds(q=>isMechanismQuestion(q) && (q.course==="mt1" || (q.course==="mt2"&&q.courseSpecific===true)));
  const productIds = questionIds(q=>/\b(product|predict|regioselectivity|regioselect|regiochemistry|markovnikov|zaitsev|selectivity)\b/i.test(questionText(q)) && (q.course==="mt1" || (q.course==="mt2"&&q.courseSpecific===true)));
  const stereoIds = questionIds(q=>isStereoQuestion(q) && (q.course==="mt1" || (q.course==="mt2"&&q.courseSpecific===true)));
  const visualIds = questionIds(q=>(q.difficulty>=2 || /\b(structure|skeletal|fischer|newman|chair|wedge|dash|visualization)\b/i.test(questionText(q))) && (q.course==="mt1" || (q.course==="mt2"&&q.courseSpecific===true)));

  if (action==="daily") {
    const currentIds = mt2Ids.length ? mt2Ids : mt1Ids;
    const maintenanceIds = mt2Ids.length ? mt1Ids : [];
    const ratio = mt2Ids.length ? 0.75 : 1;
    const queue = selectMixedQuestions(currentIds, maintenanceIds, 8, ratio);
    return startSession("daily","Daily quest",queue,8,false,{queue});
  }
  if (action==="quick") {
    const currentIds = mt2Ids.length ? mt2Ids : mt1Ids;
    const maintenanceIds = mt2Ids.length ? mt1Ids : [];
    const ratio = mt2Ids.length ? 0.75 : 1;
    const queue = selectMixedQuestions(currentIds, maintenanceIds, 5, ratio);
    return startSession("quick","Quick Quest",queue,5,false,{queue});
  }
  if (action==="ahead") {
    return startSession("ahead","Ahead of Class",previewIds,6,false);
  }
  if (action==="recovery") {
    const queue = Array.from({length:3},(_,i)=>recoverySkills[i%recoverySkills.length]).map(()=>questionIds(q=>(q.skills||[]).some(s=>recoverySkills.includes(s)) && (q.course==="mt1" || (q.course==="mt2"&&q.courseSpecific===true)))[0]).filter(Boolean);
    return startSession("recovery","Recovery Battle",queue.slice(0,3),3,false);
  }

  const modes = {
    mt1:["Midterm 1 Review",mt1Ids,10,false],
    m1boss:["Midterm 1 Boss",mt1Ids,6,true],
    mechanism:["Mechanism Grind",mechanismIds,6,false],
    product:["Product Grind",productIds,6,false],
    stereo:["Stereo Grind",stereoIds,6,false],
    visual:["Visual Grind",visualIds,6,false],
    weakness:["Weakness Hunt",weaknessIds.length?weaknessIds:confirmedAllIds,8,false],
    boss:["Boss Battle", allConfirmed ? selectMixedQuestions(mt2Ids.length?mt2Ids:mt1Ids, allConfirmed?mt1Ids:[], 8, 0.75) : mt1Ids, 8,true],
    exam:["Exam Mode", allConfirmed ? selectMixedQuestions(mt2Ids.length?mt2Ids:mt1Ids, allConfirmed?mt1Ids:[], 15, 0.8) : mt1Ids, 15, false, {timerMinutes:30}],
    final:["Final Exam Review",confirmedAllIds,12,false],
    mt2:["Midterm 2 Review",mt2Ids,10,false]
  };
  const mode = modes[action];
  if (!mode) return;
  startSession(action,mode[0],mode[1],mode[2],mode[3],mode[4]);
}

function renderStats() {
  const groups = Object.entries(skillGroups);
  const allSkills = allSkillNames();
  const history = state.bossResults.slice().reverse().slice(0,8);
  app.innerHTML = `
    <div class="stats-header"><div><div class="eyebrow">Campaign record</div><h1>Progress & stats</h1><p class="subtle">Readiness is estimated from skills you've practiced, not a guarantee of exam performance.</p></div><button class="button secondary" data-action="home">← Dashboard</button></div>
    <div class="stat-grid">
      <div class="stat-card"><span class="stat-label">Level / XP</span><span class="stat-value">${progressToNextLevel().level} / ${state.xp}</span></div>
      <div class="stat-card"><span class="stat-label">Accuracy</span><span class="stat-value">${state.attempts?Math.round(state.correct/state.attempts*100):0}%</span><span class="stat-note">${state.correct} / ${state.attempts}</span></div>
      <div class="stat-card"><span class="stat-label">Study streak</span><span class="stat-value">${state.streak} days</span></div>
      <div class="stat-card"><span class="stat-label">Midterm 1 readiness</span><span class="stat-value">${readiness("mt1")}%</span></div>
    </div>
    <section class="panel" style="margin-top:16px">
      <div class="section-heading"><h2>Skill mastery</h2><span class="tag">based on recent performance</span></div>
      <div class="skills-grid">${allSkills.map(skill=>`<div class="skill-card"><div class="mastery-label"><span>${escapeHtml(skill)}</span><span class="readiness">${skillScore(skill)}%</span></div><div class="progress-track"><div class="progress-fill" style="width:${skillScore(skill)}%"></div></div><div class="muted" style="font-size:9px;margin-top:7px">${state.mastery[skill]?.attempts||0} attempts${state.mastery[skill]?.lastSeen?` · last ${escapeHtml(state.mastery[skill].lastSeen)}`:""}</div></div>`).join("")}</div>
    </section>
    <section class="panel" style="margin-top:16px">
      <div class="section-heading"><h2>Readiness overview</h2><span class="tag">course-specific only</span></div>
      ${groups.map(([name,skills])=>`<div class="mastery-row"><div class="mastery-label"><span>${escapeHtml(name)}</span><span class="readiness">${masteryAverage(skills)}%</span></div><div class="progress-track"><div class="progress-fill" style="width:${masteryAverage(skills)}%"></div></div></div>`).join("")}
      ${!mt2Ready ? `<div class="locked-panel"><span>🔒</span><span>Midterm 2 readiness is not scored until a course content pack marked as confirmed CHEM 233 material is imported. Final readiness currently reflects Midterm 1 only.</span></div>` : `<div class="locked-panel"><span>✓</span><span>Midterm 2 content imported and active. Final readiness now includes all confirmed MT1 and MT2 material.</span></div>`}
    </section>
    <section class="panel" style="margin-top:16px">
      <div class="section-heading"><h2>Boss battle results</h2><span class="tag">${state.bossResults.length} total</span></div>
      ${history.length?`<table class="history-table"><thead><tr><th>Quest</th><th>Date</th><th>Score</th></tr></thead><tbody>${history.map(result=>`<tr><td>${escapeHtml(result.label)}</td><td>${escapeHtml(result.date)}</td><td>${result.correct}/${result.total} · ${result.percent}%</td></tr>`).join("")}</tbody></table>`:`<div class="empty-state">No boss battles completed yet.</div>`}
    </section>
    <section class="panel" style="margin-top:16px">
      <div class="section-heading"><h2>Save & content</h2><span class="tag">browser-local</span></div>
      <p class="muted" style="font-size:12px;line-height:1.6">Save data stays in this browser and is not sent to the hosting provider. Export a JSON backup before switching browsers or devices. Content-pack imports add questions without touching your save.</p>
      <div class="tools-row"><button class="button secondary small" data-action="export">Export save</button><button class="button secondary small" data-action="import">Import save / content pack</button><button class="button danger small" data-action="reset">Reset progress</button></div>
      <div id="import-status" role="status" aria-live="polite"></div>
    </section>`;
}

function exportSave() {
  const payload = {
    format:"mechanism-quest-save", version:SAVE_VERSION,
    exportedAt:new Date().toISOString(), data:state
  };
  const blob = new Blob([JSON.stringify(payload,null,2)],{type:"application/json"});
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url; link.download = `mechanism-quest-save-${getToday()}.json`;
  document.body.appendChild(link); link.click(); link.remove(); URL.revokeObjectURL(url);
  saveStatus.textContent = "Save exported. Keep the JSON file somewhere safe.";
}

function validateSave(data) {
  if (!data || data.version !== SAVE_VERSION || !Number.isFinite(data.xp) || data.xp<0 ||
      !Array.isArray(data.importedQuestions) || !Array.isArray(data.achievements) ||
      !data.mastery || typeof data.mastery !== "object" || Array.isArray(data.mastery) ||
      !data.mistakes || typeof data.mistakes !== "object" || Array.isArray(data.mistakes) ||
      !data.spacedRepetition || typeof data.spacedRepetition !== "object" ||
      !Array.isArray(data.freeResponseScores) || !Array.isArray(data.bossResults)) {
    throw new Error("This file is not a compatible Mechanism Quest save.");
  }
  const importedQuestions = data.importedQuestions.map(question =>
    validateQuestion(question,question.courseSpecific===true?"confirmed-course-material":"generic-practice")
  );
  return {...defaultState(),...data,level:Math.floor(data.xp/100)+1,importedQuestions};
}

function validateQuestion(question, packScope) {
  if (!question || typeof question.id!=="string" || typeof question.topic!=="string" ||
      typeof question.question!=="string" || typeof question.explanation!=="string" ||
      !Array.isArray(question.skills) || question.skills.length===0) {
    throw new Error("Each question needs id, topic, question, explanation, and at least one skill.");
  }
  const normalized = {
    ...question,
    course:question.course || "mt1",
    courseSpecific:question.courseSpecific === true,
    difficulty:Number(question.difficulty)||1
  };
  if (!["mt1","mt2"].includes(normalized.course)) throw new Error(`Question ${question.id} has an unsupported course value.`);
  if (!["choice","text","draw","rank","select-atom"].includes(question.type)) throw new Error(`Question ${question.id} has an unsupported type.`);
  if (question.type==="choice" && (!Array.isArray(question.choices)||!question.choices.includes(question.answer))) throw new Error(`Choice question ${question.id} must include its answer in choices.`);
  if (question.type==="text" && (!Array.isArray(question.acceptedAnswers)||!question.acceptedAnswers.length)) throw new Error(`Text question ${question.id} needs acceptedAnswers.`);
  if (question.type==="draw" && !question.rubric) throw new Error(`Drawing question ${question.id} needs a rubric.`);
  if (question.type==="rank" && (!Array.isArray(question.items)||!Array.isArray(question.answer)||question.items.length!==question.answer.length||question.answer.some(item=>!question.items.includes(item)))) throw new Error(`Ranking question ${question.id} needs matching items and answer order.`);
  if (question.type==="select-atom") {
    const structure = question.structure;
    if (!structure || !Array.isArray(structure.atoms) || structure.atoms.length===0 || !Array.isArray(structure.bonds)) {
      throw new Error(`Structure question ${question.id} needs atoms and bonds.`);
    }
    const atomIds = new Set();
    for (const atom of structure.atoms) {
      if (!atom || typeof atom.id!=="string" || typeof atom.label!=="string" ||
          !Number.isFinite(atom.x) || !Number.isFinite(atom.y) || atomIds.has(atom.id)) {
        throw new Error(`Structure question ${question.id} has an invalid atom definition.`);
      }
      atomIds.add(atom.id);
    }
    if (!atomIds.has(question.answer) || structure.bonds.some(bond=>
      !bond || !atomIds.has(bond.from) || !atomIds.has(bond.to) || ![1,2].includes(bond.order)
    )) {
      throw new Error(`Structure question ${question.id} has invalid bonds or an unknown answer atom.`);
    }
    if (structure.viewBox && !/^\d+(?:\.\d+)? \d+(?:\.\d+)? \d+(?:\.\d+)? \d+(?:\.\d+)?$/.test(structure.viewBox)) {
      throw new Error(`Structure question ${question.id} has an invalid SVG viewBox.`);
    }
  }
  if (normalized.course==="mt2" && packScope!=="confirmed-course-material" && normalized.courseSpecific) {
    throw new Error(`Question ${question.id} cannot be marked course-specific unless the pack declares confirmed-course-material scope.`);
  }
  return normalized;
}

async function importFile(file) {
  const status = document.getElementById("import-status");
  const report = message => {
    if (status) status.innerHTML = `<div class="notice">${escapeHtml(message)}</div>`;
    saveStatus.textContent = message;
  };
  try {
    const parsed = JSON.parse(await file.text());
    if (parsed.format==="mechanism-quest-save") {
      const nextState = validateSave(parsed.data);
      if (!confirm("Import this save and replace the progress currently stored in this browser? Export your current save first if you may need it.")) return;
      state = nextState;
      saveState("Save imported and restored.");
      renderHome();
      return;
    }
    const pack = parsed.contentPack || parsed;
    if (pack.format!=="mechanism-quest-content-pack" || pack.version!==1 || !Array.isArray(pack.questions) || !pack.pack || typeof pack.pack.id!=="string") {
      throw new Error("This JSON is neither a compatible save nor a version 1 content pack.");
    }
    const questions = pack.questions.map(question=>validateQuestion(question,pack.pack.scope));
    const existing = new Set(allQuestions().map(question=>question.id));
    const incomingIds = new Set();
    const duplicate = questions.find(question=>{
      if (existing.has(question.id) || incomingIds.has(question.id)) return true;
      incomingIds.add(question.id);
      return false;
    });
    if (duplicate) throw new Error(`Question ID "${duplicate.id}" already exists; give new questions unique IDs.`);
    state.importedQuestions.push(...questions);
    if (questions.some(question=>question.course==="mt2")) state.unlockedContent = [...new Set([...state.unlockedContent,"mt2"])];
    saveState(`${questions.length} content-pack question${questions.length===1?"":"s"} added; existing progress preserved.`);
    renderHome();
    const homeStatus = document.createElement("div");
    homeStatus.className = "notice";
    homeStatus.textContent = `${questions.length} question${questions.length===1?"":"s"} added from "${pack.pack.title || pack.pack.id}". Your existing save and progress were preserved.`;
    app.prepend(homeStatus);
  } catch (error) {
    console.error("Content import failed.",error);
    report(`Import failed: ${error.message}`);
  }
}

function resetProgress() {
  if (!confirm("Reset all Mechanism Quest progress stored in this browser? This removes XP, streak, mastery, mistakes, imported content packs, and review schedules. Export a backup first if unsure.")) return;
  state = defaultState();
  activeSession = null;
  saveState("Progress reset. A fresh save is ready.");
  renderHome();
}

function moveRank(direction,index) {
  const target = index + direction;
  if (target<0 || target>=selectedRank.length) return;
  [selectedRank[index],selectedRank[target]] = [selectedRank[target],selectedRank[index]];
  const question = getQuestion(activeSession.queue[activeSession.index]);
  const list = document.querySelector(".rank-list");
  if (list) list.outerHTML = renderRank(question);
}

app.addEventListener("click", event => {
  const atomTarget = event.target.closest("[data-atom]");
  if (atomTarget && !committed) {
    selectedAtom = atomTarget.dataset.atom;
    document.querySelectorAll(".atom-node").forEach(atom=>atom.classList.toggle("selected",atom.dataset.atom===selectedAtom));
    document.querySelectorAll(".atom-node").forEach(atom=>atom.setAttribute("aria-pressed",String(atom.dataset.atom===selectedAtom)));
    return;
  }
  const target = event.target.closest("button");
  if (!target) return;
  if (target.dataset.action) {
    const action = target.dataset.action;
    if (action==="home") return renderHome();
    if (action==="stats") return renderStats();
    if (action==="export") return exportSave();
    if (action==="import") return document.getElementById("import-file").click();
    if (action==="reset") return resetProgress();
    if (action==="hint") {
      if (revealedHint >= 3) return;
      revealedHint += 1;
      if (activeSession && activeSession.hintsUsed !== undefined) activeSession.hintsUsed += 1;
      return renderQuestion();
    }
    if (action==="check-answer") return checkAnswer();
    if (action==="reveal-rubric") return revealRubric();
    if (action==="exam-next") return advanceExam();
    if (action==="next") {
      if (!activeSession) return;
      activeSession.index += 1;
      delete activeSession.lastOutcome;
      activeSession.heartLost = false;
      selectedChoice = null;
      selectedAtom = null;
      selectedRank = [];
      activeSession.draft = "";
      selectedConfidence = 2;
      revealedHint = 0;
      committed = false;
      return renderQuestion();
    }
    return startByAction(action);
  }
  if (target.dataset.choice !== undefined) {
    if (committed) return;
    selectedChoice = target.dataset.choice;
    document.querySelectorAll(".choice").forEach(button=>button.classList.toggle("selected",button===target));
  }
  if (target.dataset.confidence) {
    if (!committed) setSessionConfidence(Number(target.dataset.confidence));
  }
  if (target.dataset.rank) {
    if (!committed) moveRank(target.dataset.rank==="up"?-1:1,Number(target.dataset.index));
  }
  if (target.dataset.assessment) {
    if (!activeSession || !committed || activeSession.lastOutcome) return;
    const mapping = {
      correct:[true,"correct"], minor:[false,"minor"], major:[false,"major"], stuck:[false,"stuck"]
    };
    const [correct,severity] = mapping[target.dataset.assessment];
    const question = getQuestion(activeSession.queue[activeSession.index]);
    commitOutcome(question,correct,severity);
  }
});

app.addEventListener("keydown", event => {
  if (event.key==="Enter" && event.target.id==="answer-input") checkAnswer();
  if ((event.key==="Enter" || event.key===" ") && event.target.matches("[data-atom]")) {
    event.preventDefault();
    event.target.click();
  }
});

document.getElementById("import-file").addEventListener("change", event => {
  const [file] = event.target.files;
  if (file) importFile(file);
  event.target.value = "";
});

document.getElementById("theme-toggle").addEventListener("click", () => {
  const root = document.documentElement;
  const next = root.dataset.theme==="light" ? "dark" : "light";
  root.dataset.theme = next;
  try { localStorage.setItem(THEME_KEY,next); }
  catch (error) { console.error("Could not save the theme preference.",error); }
});

document.querySelectorAll("[data-action='stats']").forEach(button=>button.addEventListener("click",renderStats));
document.querySelector(".brand").addEventListener("click",event=>{event.preventDefault();renderHome();});

try {
  const savedTheme = localStorage.getItem(THEME_KEY);
  if (savedTheme==="light" || savedTheme==="dark") document.documentElement.dataset.theme = savedTheme;
} catch (error) {
  console.error("Could not read the theme preference.",error);
}
state = readSave();
const todayAtStartup = getToday();
if (state.lastStudyDate && state.lastStudyDate !== todayAtStartup) {
  const yesterdayAtStartup = new Date();
  yesterdayAtStartup.setDate(yesterdayAtStartup.getDate()-1);
  const yesterdayKey = `${yesterdayAtStartup.getFullYear()}-${String(yesterdayAtStartup.getMonth()+1).padStart(2,"0")}-${String(yesterdayAtStartup.getDate()).padStart(2,"0")}`;
  if (state.lastStudyDate !== yesterdayKey) state.streak = 0;
  state.hearts = 3;
  saveState();
}
renderHome();
if ("serviceWorker" in navigator && (location.protocol==="https:" || location.hostname==="localhost")) {
  navigator.serviceWorker.register("./sw.js").catch(error => {
    console.error("Offline caching could not be enabled.",error);
    saveStatus.textContent = "App works online; offline caching could not be enabled in this browser.";
  });
}
