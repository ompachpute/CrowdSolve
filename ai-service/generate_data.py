"""
Generates a synthetic labeled dataset of civic complaints for training the
category + severity classifiers. No real complaint data was available, so
examples are hand-templated (varied phrasing, not just keyword lists) and
combined programmatically. Output: data/synthetic_complaints.csv
"""
import csv
import random

random.seed(42)

CATEGORY_SENTENCES = {
    "Infrastructure": [
        "There is a large pothole in the middle of the main road near our colony",
        "The bridge connecting the two villages has visible cracks and feels unstable",
        "A water pipeline burst yesterday and flooded the entire street",
        "Streetlights on our lane have not worked for the past three weeks",
        "The under-construction building next door has unsafe scaffolding hanging over the footpath",
        "Power has been out in our entire block since last night",
        "The drainage system is completely blocked and water is overflowing onto the road",
        "Our building's staircase railing is broken and about to fall off",
        "The government office building's roof is leaking badly during rains",
        "The newly laid road already has cracks and uneven patches",
        "There is a huge hole in the footpath that pedestrians keep tripping over",
        "The public toilet construction has been abandoned midway for months",
        "Electric wires are hanging dangerously low near the school gate",
        "The overhead water tank in our area has started leaking",
        "Construction debris has been blocking the lane entrance for a week",
    ],
    "Environment": [
        "Garbage has not been collected from our street for over a week",
        "A nearby factory is dumping waste directly into the river",
        "Trees on the main avenue were cut down without any prior notice",
        "There is a strong foul smell coming from the open drain near the market",
        "Air quality in our area has become very poor due to nearby construction dust",
        "Someone is illegally burning plastic waste behind the community hall",
        "The lake near our society is filled with plastic and industrial waste",
        "Loud noise from the nearby factory continues late into the night",
        "Household waste is being dumped in the empty plot next to our homes",
        "The park's trees are dying because of an unknown chemical spill nearby",
        "Sewage water is flowing into the small pond used by local birds",
        "Dust from the cement factory is settling on our rooftops and plants",
        "Untreated waste from the market is polluting the groundwater",
        "The riverside area is filled with plastic bags and bottles",
        "Smoke from open garbage burning is affecting people's breathing nearby",
    ],
    "Education": [
        "Our government school has not had a mathematics teacher for two months",
        "The classroom ceiling fan has been broken for the entire semester",
        "Students do not have enough textbooks for the new academic year",
        "The school library has been locked and unused since last year",
        "College fee receipts are not being issued despite full payment",
        "There are no proper desks and children sit on the floor in class",
        "The tuition center is charging extra fees not mentioned earlier",
        "Our school building lacks a functioning fan or cooler in summer",
        "Teachers are frequently absent and classes remain unsupervised",
        "The scholarship funds promised to students have not been disbursed",
        "The primary school has no boundary wall making it unsafe for children",
        "Exam results have been delayed for over a month with no explanation",
        "The school computer lab equipment is outdated and mostly non-functional",
        "Our college corridor lights don't work making evening classes difficult",
        "The new school building construction has been stalled for a year",
    ],
    "Health": [
        "The local government hospital has been out of basic medicines for weeks",
        "There is no doctor available at the primary health clinic after 2 PM",
        "The community health center's vaccine stock has run out",
        "Sanitation at the government hospital ward is extremely poor",
        "Patients are made to wait for hours without any medical attention",
        "The ambulance service in our area does not respond to calls",
        "There has been a rise in dengue cases due to stagnant water nearby",
        "The clinic lacks proper equipment to handle even minor emergencies",
        "Our area has no functioning health center within several kilometers",
        "The hospital staff refused treatment without an advance payment",
        "There is no clean drinking water available in the health center",
        "Mosquito breeding near the clinic is being ignored despite complaints",
        "The maternity ward lacks basic hygiene and clean bedsheets",
        "Medical waste is not being disposed of properly outside the clinic",
        "The health camp promised for our village never took place",
    ],
    "Safety": [
        "There has been a series of thefts in our neighborhood over the last month",
        "A fire broke out in the market area and no fire truck arrived on time",
        "Women in our area do not feel safe walking after dark due to poor lighting",
        "There was a violent altercation near the bus stop yesterday evening",
        "Police have not responded despite multiple complaints about harassment",
        "An accident-prone junction near our society still has no traffic signal",
        "Unknown men have been loitering around the school gate lately",
        "There was an attempted robbery at the local shop last night",
        "The security guard post outside our colony has been vacant for months",
        "A gas leak was reported near the residential block causing panic",
        "Stray incidents of eve-teasing near the college gate go unreported",
        "The old building next to us shows signs of imminent structural collapse",
        "There has been an increase in chain snatching incidents on this road",
        "A minor fire in the electrical box was reported near the market",
        "Local shopkeepers report frequent extortion threats from unknown people",
    ],
    "Public Transport": [
        "Buses on this route have been irregular for the past two weeks",
        "The local train has been delayed by over an hour every day this month",
        "The metro station escalator has been out of order for a long time",
        "Auto and taxi drivers are refusing to use the meter and overcharging",
        "Our area does not have any bus stop within walking distance",
        "The bus stand shelter has collapsed and was never repaired",
        "Traffic congestion at this junction causes hour-long delays daily",
        "The railway station platform lacks proper lighting at night",
        "Commuters are packed beyond capacity in the morning buses",
        "The new metro line construction has blocked the main commute route",
        "Taxi stand outside the station has no queue management causing chaos",
        "Frequent breakdowns on this route have disrupted daily commute",
        "The train station lacks a functioning ticket counter most days",
        "Bus drivers skip our stop regularly during peak hours",
        "Vehicles violate traffic signals constantly at this intersection",
    ],
    "Other": [
        "I want to raise a general suggestion about our community center timings",
        "There is a dispute between neighbors over a shared boundary wall",
        "We would like better public seating in the community park",
        "Our request for a new public notice board has not been addressed",
        "There is confusion regarding the local office's working hours",
        "We suggest adding more benches near the walking track",
        "The community hall booking process is unclear and inconsistent",
        "Residents would like a suggestion box installed at the local office",
        "There is a minor disagreement about parking space allocation",
        "We would appreciate clearer signage for the new community office",
    ],
}

SEVERITY_SENTENCES = {
    "CRITICAL": [
        "This is a life-threatening emergency and needs an immediate response.",
        "This is extremely dangerous and could lead to a fatal accident.",
        "There has been a partial collapse and people could be seriously hurt.",
        "This requires urgent emergency action right now, lives are at risk.",
        "Someone could die if this is not fixed within hours.",
        "This is an absolute emergency, please send help immediately.",
        "This could turn fatal any moment, immediate action is critical.",
        "People are in immediate danger and this cannot wait even a day.",
        "This is a do-or-die situation that needs action within the hour.",
        "An explosion or collapse could happen at any moment here.",
    ],
    "HIGH": [
        "This is urgent and quite severe, please act as soon as possible.",
        "This has become a serious and hazardous situation for residents.",
        "This is a critical problem that has been getting worse and worse.",
        "This is a severe issue causing real danger to people nearby.",
        "This needs to be resolved within the next day or two, it's serious.",
        "This has escalated quickly and is now a major safety concern.",
        "This is a high priority matter that cannot be delayed much longer.",
        "Several people have already been affected and it keeps getting worse.",
        "This is putting people at real risk if ignored much longer.",
        "This has been ongoing for days and is becoming genuinely serious.",
    ],
    "MEDIUM": [
        "This has become a moderate concern causing ongoing inconvenience.",
        "This issue needs attention soon as it is affecting daily life.",
        "This is a genuine problem that residents are worried about.",
        "This has been a recurring inconvenience for the whole area.",
        "This isn't an emergency but it really should be looked into this week.",
        "This is a fair concern that's been bothering the whole neighborhood.",
        "This is not extremely urgent but is clearly a real problem now.",
        "It would help a lot if this could be sorted out in the coming days.",
        "This is a noticeable problem affecting quite a few households.",
        "This has been annoying residents for a couple of weeks now.",
    ],
    "LOW": [
        "This is a minor issue but a small fix would be appreciated.",
        "This is just a small suggestion for improvement, not urgent.",
        "This is a cosmetic issue that can be fixed whenever convenient.",
        "This is a low priority request whenever the concerned team is free.",
        "There's no rush on this, just flagging it for whenever possible.",
        "This is a small inconvenience, nothing serious at all.",
        "Whenever someone has time, this would be a nice small fix.",
        "This is barely noticeable but thought it was worth mentioning.",
        "Not a big deal, just a minor thing that could be improved.",
        "This can wait, it's a very small and low-impact issue.",
    ],
}


def generate_rows():
    rows = []
    for category, sentences in CATEGORY_SENTENCES.items():
        for sent in sentences:
            for severity, sev_sentences in SEVERITY_SENTENCES.items():
                sev_sent = random.choice(sev_sentences)
                # Randomize order so the model doesn't just learn "last sentence = severity"
                if random.random() < 0.5:
                    text = f"{sent}. {sev_sent}"
                else:
                    text = f"{sev_sent} {sent}."
                rows.append({"text": text, "category": category, "severity": severity})
    random.shuffle(rows)
    return rows


if __name__ == "__main__":
    rows = generate_rows()
    with open("data/synthetic_complaints.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=["text", "category", "severity"])
        writer.writeheader()
        writer.writerows(rows)
    print(f"Generated {len(rows)} synthetic labeled examples -> data/synthetic_complaints.csv")
