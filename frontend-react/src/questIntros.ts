// The prologue for each flagship story — sets the scene, introduces the full
// cast up front with their visible motives, and plants the specific facts
// (measurements, times, names) that later clues and checkpoints reuse. This
// is the "fair play" convention classic detective fiction runs on: nothing
// at the final reveal should be information the player couldn't have had
// all along.
export interface QuestCastEntry {
  name: string;
  detail: string;
}

export interface QuestIntro {
  storyId: string;
  sceneText: string; // markdown — the full prologue
  cast: QuestCastEntry[];
}

export const QUEST_INTROS: QuestIntro[] = [
  {
    storyId: "night-train-murder",
    sceneText:
      "**The Meridian Express, somewhere in the mountains, well past midnight.**\n\n" +
      "The train lurches to a final stop, buried nose-first in a snowdrift. It will not move again before morning. You are a consulting mathematician, three carriages back from the private compartments, when Rosalind — the young conductor's aide — knocks on your door, out of breath. \"There's been a death, sir. Mr. Victor Ashford. His door was locked from the inside, and the doctor says he's been gone for hours. The nearest police are a day away by road, and stuck same as we are by rail. The conductor asks if you'll look into it before anyone's memory of tonight gets any less reliable.\"\n\n" +
      "You agree, and Rosalind lays out what's already known. Ashford was last seen alive at **11:00 PM**, in the dining car, arguing quietly with someone she couldn't identify. He owned a controlling share in a shipping firm, and was, by every account, a man with a gift for making enemies. The train is seven carriages long, each measuring exactly **18 meters**, with Ashford's compartment in the fourth. Only five other passengers are travelling in this section tonight, and none of them could have left the train.",
    cast: [
      {
        name: "Madame Dubois",
        detail: "A jewel dealer, several months behind on a considerable debt to Ashford.",
      },
      {
        name: "Colonel Price",
        detail: "A retired officer. Rosalind mentions, in passing, an old business dealing gone sour between the two men — \"years ago now, but he's never been quiet about it after a drink.\"",
      },
      {
        name: "Mr. Henley",
        detail: "Ashford's business partner. Under the terms of their partnership, Ashford's shares pass to Henley outright if Ashford dies without a will — and Ashford, everyone agrees, never got around to writing one.",
      },
      {
        name: "Lady Winslow",
        detail: "A socialite travelling alone. Rosalind notices she's been avoiding Ashford all evening, though she can't say why.",
      },
      {
        name: "Jenkins",
        detail: "The train's porter — unusually tall, well-liked by the staff, seemingly with nothing at all to gain from Ashford's death.",
      },
    ],
  },
  {
    storyId: "euclid-trail",
    sceneText:
      "**A dig site outside Alexandria, at the edge of an old olive grove.**\n\n" +
      "Elena, your guide and translator, has spent three years chasing rumors of a society that once called itself the Keepers of the Elements — a small circle who, the old letters say, guarded something Euclid himself asked to be hidden after his death: not his famous public work, copied and taught for two thousand years, but something else entirely. \"Every trial they built tests the same idea,\" Elena tells you, unrolling a fragile translated fragment. \"They only ever trusted a path forward when its claim was true *without exception* — not true sometimes, not true for one example you happened to think of, but true for every case, always. That was the whole test. Anyone who couldn't tell the difference was never meant to get further.\"\n\n" +
      "The fragment describes the trial in three stages: first, three tests of geometry and number, cut into stone along the entry passage; then a fork with three carved paths, only one of them real; then, deeper still, a locked vault, and beyond it, three final sealed chambers. \"If the letters are right,\" Elena says, \"whatever's inside was never meant for everyone — only for whoever was patient enough to check every claim properly, all the way down.\"",
    cast: [
      {
        name: "Elena",
        detail: "Your guide and translator — she reads the old Greek inscriptions faster than you can work out the mathematics behind them.",
      },
      {
        name: "The Keepers of the Elements",
        detail: "The old society that built this place. Long gone, but their one rule survives in every trial: trust only what's true without exception.",
      },
    ],
  },
  {
    storyId: "statisticians-gambit",
    sceneText:
      "**An insurance company's archive, eight o'clock in the evening.**\n\n" +
      "You are an independent forensic statistician, called in after hours because the firm's own people can't agree on what they're looking at. Miss Eleanor Voss, a senior clerk in the actuarial department, has been found dead in the archive vault — and everyone already knows why she was down there. For the past several weeks, Voss had been quietly building a case that a decade of insurance claims had been systematically inflated, the fraud so well hidden it took someone who genuinely understood the company's own numbers to even notice the pattern.\n\n" +
      "Mr. Pratt, a junior clerk young enough to still be shaken by it, walks you through what's known. The police surgeon puts her body temperature at **30°C** at 8 PM, in a vault that runs unusually cold. Voss's own private ledgers, still spread across her desk, show the fraud pattern rising steadily, quarter after quarter, for **twelve straight quarters**. Five people had access to the archive that evening.",
    cast: [
      {
        name: "Mr. Abernathy",
        detail: "The firm's chief actuary. If Voss's fraud discovery goes public, it discredits an entire decade of his own pricing models.",
      },
      {
        name: "Mrs. Calloway",
        detail: "Head of claims. Every fraudulent payout in Voss's files was approved through her department, over her own signature.",
      },
      {
        name: "Mr. Devereux",
        detail: "A junior clerk who owed Voss a considerable personal debt — she had quietly lent him money some months back.",
      },
      {
        name: "Miss Fairweather",
        detail: "The company owner's daughter, set to inherit the firm outright — a firm whose reputation, and value, depends on this fraud staying buried.",
      },
      {
        name: "Mr. Griggs",
        detail: "The night watchman. Keys to every door in the building, and — as far as anyone can tell — nothing at all to gain from Miss Voss's death.",
      },
    ],
  },
  {
    storyId: "pirates-cove",
    sceneText:
      "**A hidden cove, somewhere no chart quite agrees on.**\n\n" +
      "Bess has been chasing this cove for the better part of ten years — ever since she was young enough to still believe the stories about Captain Corvin Blackwater's lost hoard. \"Most captains hid their treasure behind a riddle or a threat,\" she tells you, unrolling the map's tattered second half across a flat rock. \"Blackwater hid his behind mathematics. He never trusted a crew he couldn't verify, and he trusted words even less — half his own men couldn't read. Numbers, angles, ropes and tides: those, he trusted completely, because they can't lie to you the way a person can.\"\n\n" +
      "The map marks the cove's entrance stone, a tide that cycles fully every **6 hours**, and — scrawled almost as an afterthought in the margin — a moon-cycle marking of **4 hours** that Bess admits she's never been able to make sense of. \"Every trial on this island tests the same thing,\" she says. \"Whether you check your answer properly, or just guess and hope. Blackwater built this whole cove to separate the two kinds of people.\"",
    cast: [
      {
        name: "Bess",
        detail: "Your guide, and the only person alive who's made it this far into the cove before — though never past it.",
      },
      {
        name: "Captain Corvin Blackwater",
        detail: "Dead a century now. Built this cove's trials himself, trusting arithmetic over any living crew member.",
      },
    ],
  },
  {
    storyId: "blood-on-the-chessboard",
    sceneText:
      "**An international chess championship, tournament hall, well after the crowds have gone.**\n\n" +
      "Grandmaster Viktor Kessler is found dead at his own board, mid-game, his final position frozen in place. Mira, the tournament's arbiter, met you at the door white-faced. \"He was the best player most of us have ever shared a room with,\" she says. \"And now his own last move might be the only statement he ever gets to make about what happened tonight.\"\n\n" +
      "Mira lays out what's already known. The game began at the top of the evening round; the last move on the official scoresheet is timestamped **8:52 PM**. Kessler's opponent, a young challenger named Aria Chen, says she stepped away and returned to find him dead — no more than fifteen minutes, by her own account. Five people connected to the tournament had reason to be nearby tonight.",
    cast: [
      {
        name: "Olenska",
        detail: "Kessler's chief rival for the championship title itself — the one prize now entirely hers to lose.",
      },
      {
        name: "Whitfield",
        detail: "The tournament's secret financial backer, known in quieter circles to run an underground chess-betting ring.",
      },
      {
        name: "Petrov",
        detail: "A former student, publicly humiliated by Kessler in a book years ago, and never quiet about the grudge since.",
      },
      {
        name: "Delacroix",
        detail: "A chess journalist, close to publishing a story about irregularities in Kessler's past results.",
      },
      {
        name: "Halvorsen",
        detail: "The tournament director. Controls every pairing and every ruling — and, as far as anyone can tell, has nothing personal at stake.",
      },
    ],
  },
  {
    storyId: "lighthouse-keepers-code",
    sceneText:
      "**A remote coastal lighthouse, the morning after the old keeper's funeral.**\n\n" +
      "Finch, barely a year into her own apprenticeship, found the logbook tucked behind a loose stone in the lamp room — pages of routine weather notes that don't stay routine for long. \"Everyone always said old Hale was just eccentric,\" she tells you, turning the brittle pages carefully. \"Counting gulls, mixing his own ink, obsessing over tide tables long after he'd memorized them. I don't think any of that was really what it looked like.\"\n\n" +
      "The logbook, once you both start reading closely, describes the wreck of a merchant vessel — **the Calypso's Promise**, lost on the rocks generations ago — and the location of whatever survived her sinking. Hale never wrote the answer down plainly. He encoded it entirely in the language of his own trade: light intervals, tide cycles, bearings, and numbers, because those, unlike people, had never once lied to him in forty years of keeping this light.",
    cast: [
      {
        name: "Finch",
        detail: "Your fellow apprentice keeper — quick with a rope and a chart, and utterly unafraid of cold water.",
      },
      {
        name: "Old Thomas Hale",
        detail: "The lighthouse's keeper for over forty years, recently passed. Trusted numbers over people, and built his final secret entirely out of them.",
      },
    ],
  },
  {
    storyId: "cryptographers-curse",
    sceneText:
      "**A wartime codebreaking bureau, housed in a requisitioned country manor, well past curfew.**\n\n" +
      "Iris, a junior clerk barely six months into the work, meets you at the gate white-faced. \"Dr. Edith Faraday is dead, sir. Found in the code room an hour ago. She'd told me just yesterday she was close to something — a shift in the enemy's cipher method nobody else here had even noticed yet.\" The bureau's chief has already sealed the wing: five people had access tonight, and the killer, whoever they are, is almost certainly still inside these walls.\n\n" +
      "Iris lays out what's known. Faraday was last seen alive at nine o'clock, locking the code room's door behind her as usual. She kept meticulous logs — shift keys, decoded traffic, personnel numbers — trusting a number that checked out over a colleague's word every time the two disagreed. \"She used to say arithmetic was the only witness in this building that couldn't be bribed, frightened, or mistaken,\" Iris says. \"I think that's exactly why someone needed her gone before she finished writing it down.\"",
    cast: [
      {
        name: "Ashworth",
        detail: "A senior codebreaker with an old failure in his file — a missed decryption years back that Faraday's own methods had recently, quietly, threatened to expose again.",
      },
      {
        name: "Lindqvist",
        detail: "Faraday's closest professional rival, publicly still claiming partial credit for a cipher-breaking method that was, in truth, entirely her own.",
      },
      {
        name: "Reyes",
        detail: "Handles the overnight communications line — long rumored, never proven, to be passing more than official traffic along it.",
      },
      {
        name: "Okonkwo",
        detail: "Was once engaged to a colleague who died early in the war; something about Faraday's recent work has visibly unsettled her for weeks.",
      },
      {
        name: "Pettigrew",
        detail: "The night duty officer, walking the same rounds every hour for years. As far as anyone can tell, entirely without motive.",
      },
    ],
  },
  {
    storyId: "sky-chart-expedition",
    sceneText:
      "**A mountaintop astronomy camp, above the tree line, the night sky unusually clear.**\n\n" +
      "Amara has spent two seasons tracking down a legend: an ancient civilization of astronomer-priests who once mapped these peaks, and who are said to have hidden a cache of instruments and records somewhere among them. \"They had exactly one rule,\" she tells you, laying out a weathered star-chart by lantern light. \"Trust only what's true without exception — not true most nights, not true for one star you happened to be watching, but true for every case, always. Everything they built into this mountain tests that same rule.\"\n\n" +
      "The chart marks a magnitude scale where each step is a factor of roughly **2.5** in brightness, and a calendar that drifts by almost exactly **6 hours** every year against the true seasons — both facts, Amara says, that the priests built directly into the trail's puzzles. \"If the old stories are right,\" she says, \"whatever they hid up here was never meant for a casual traveler — only for someone patient enough to check every claim against the sky itself.\"",
    cast: [
      {
        name: "Amara",
        detail: "Your expedition guide — she's spent two seasons studying the astronomer-priests' charts and reads their old notation faster than you can work out the mathematics behind it.",
      },
      {
        name: "The Astronomer-Priests",
        detail: "The ancient civilization that built this trail. Long gone, but their one rule survives in every marker: trust only what's true without exception.",
      },
    ],
  },
  {
    storyId: "clockmakers-secret",
    sceneText:
      "**A master clockmaker's workshop, gaslight flickering off a hundred hanging gears.**\n\n" +
      "Wren, barely a year into her apprenticeship under Josiah Thorne, meets you in the doorway, hands still trembling. \"He's dead, sir. Found him myself, not an hour ago, slumped over the workbench — right beside the Sentinel, the clock he swore would be his masterpiece.\" She glances back at an enormous half-finished clock dominating the workshop's center, its gears arranged in patterns that don't look like any timepiece you've studied. \"He told me last week the gears weren't just for keeping time anymore. He'd built something else into them — a message, he said, that only someone patient enough to actually count could ever read.\"\n\n" +
      "The night watchman found the workshop's side door unlatched at midnight, though Thorne had wound the Sentinel's mainspring himself at nine, same as every night for thirty years. Five people had a reason to want inside that workshop tonight — and one of them, Wren is certain, never left.",
    cast: [
      {
        name: "Callum",
        detail: "Thorne's junior apprentice, passed over just last month when Thorne named his own nephew — who has never spent a single day at the bench — as heir to the whole workshop.",
      },
      {
        name: "Mercer",
        detail: "A rival clockmaker across town, locked with Thorne in competition for the same royal commission, due to be decided within the week.",
      },
      {
        name: "Lady Ashcombe",
        detail: "A patron who commissioned a custom timepiece months ago and still owes Thorne a considerable balance, due in full the very day he died.",
      },
      {
        name: "Grimsby",
        detail: "Thorne's business partner of twenty years, quietly skimming from their shared accounts — a discrepancy Thorne's own meticulous ledgers were only days from catching.",
      },
      {
        name: "Pruitt",
        detail: "The workshop's night watchman, walking the same rounds every hour for a decade. As far as anyone can tell, entirely without motive.",
      },
    ],
  },
  {
    storyId: "pharaohs-vault",
    sceneText:
      "**The base of a half-buried pyramid, sand shifting away under a relentless sun.**\n\n" +
      "Nadia has spent three field seasons proving what her colleagues call a fool's theory: that this minor, unnamed pyramid hides a sealed treasury the ancient builders never wanted grave robbers — or anyone else — to find. \"They didn't guard it with soldiers,\" she tells you, brushing sand from a carved lintel. \"They guarded it with proportion. Every real passage in this place is built to an exact ratio the builders trusted completely; every false one is close, but never quite right. Get sloppy with your arithmetic in here, and the mountain simply keeps its secret.\"\n\n" +
      "Her measurements already tell you two things worth remembering: the pyramid's full height is 120 meters, and its square base runs exactly 180 meters along each side. \"Whatever's hidden here,\" Nadia says, stepping into the entrance shaft, \"the builders trusted their numbers a great deal more than they trusted the men who might come looking.\"",
    cast: [
      {
        name: "Nadia",
        detail: "Your expedition's lead archaeologist — three field seasons in, and the first to take this pyramid's numbers as seriously as its inscriptions.",
      },
      {
        name: "The Builders",
        detail: "The ancient architects who raised this pyramid. Long gone, but every passage they cut still holds to the same exact proportions they trusted over any guard.",
      },
    ],
  },
  {
    storyId: "conservatory-killing",
    sceneText:
      "**A grand symphony hall, the night of the season's final rehearsal.**\n\n" +
      "Odile, the assistant conductor, meets you backstage clutching a baton that isn't hers. \"Maestro Vale is dead, right at the podium,\" she says, still shaking. \"We broke for intermission at the usual time, and when we came back... he was already gone. The last page of his score isn't music at all — it's numbers. Rows of them, in his own hand.\" She holds up the page; where notes should sit on the staff, there are only figures, ratios, fractions.\n\n" +
      "The hall's break ran exactly twenty minutes, and five people had reason enough to slip away from the crowd during it. Vale, everyone agrees, was a brilliant conductor and an even more exacting one — precise to the beat, precise with money, precise with people's patience.",
    cast: [
      {
        name: "Sabrina Lowe",
        detail: "The orchestra's principal violinist, promised the concertmaster's chair two years ago — a promise Vale, as far as she knew, had never once followed through on.",
      },
      {
        name: "Dmitri Volkov",
        detail: "A rival conductor, locked with Vale in competition for the same prestigious guest-conducting post, to be decided within days.",
      },
      {
        name: "Countess Fenwick",
        detail: "The hall's principal patron, whose funding Vale depended on completely — and who made no secret of wanting a say in next season's programming that Vale refused to give her.",
      },
      {
        name: "Pemberton",
        detail: "The hall's box-office manager, quietly skimming from nightly ticket receipts — a discrepancy Vale's own meticulous audits were only weeks from catching.",
      },
      {
        name: "Ravi",
        detail: "The stage manager, walking the same pre-curtain rounds every night for years. As far as anyone can tell, entirely without motive.",
      },
    ],
  },
  {
    storyId: "silk-road-cipher",
    sceneText:
      "**A weathered caravanserai at the edge of the desert, the last stop before the open trade route.**\n\n" +
      "Layla has guided caravans along this route for twenty years, and has spent the last three chasing a story older than her own family's trading house: that a vanished merchant guild once hid a fortune along these very waypoints, protected by nothing but arithmetic. \"They didn't trust guards with it,\" she tells you, unrolling a ledger brittle with age. \"Guards can be bribed, and roads can be robbed. A number that's wrong is wrong for everyone, the same way, every time — that's the only guard they ever fully trusted.\"\n\n" +
      "Her own ledger already tells you two things worth remembering: the border post trades 1 gold dinar for exactly 12 silver dirhams, and the caravan makes a steady 24 kilometers a day. \"Every waypoint from here to the old guild's cache tests the exact same thing,\" Layla says, checking the pack straps one last time. \"Whether you trust your own arithmetic, or you guess and hope.\"",
    cast: [
      {
        name: "Layla",
        detail: "Your caravan guide — twenty years on this route, and the first to take the old merchant-guild stories as seriously as the maps themselves.",
      },
      {
        name: "The Merchant Guild",
        detail: "The vanished traders who once ran this route. Long gone, but every waypoint they built still tests the same thing: whether your arithmetic can be trusted completely.",
      },
    ],
  },
  {
    storyId: "carnival-of-lost-souls",
    sceneText:
      "**A traveling carnival, packed up for the night, one string of lights still burning over an empty midway.**\n\n" +
      "Nell, the carnival's youngest ticket-taker, meets you by the gate, out of breath. \"Mr. Crane's dead, in Madame Zora's own tent,\" she says. \"He'd been going over every game on this midway for weeks — pen and paper, actual odds, not just the numbers painted on the wheels. He told me himself, just yesterday, that one particular booth's numbers didn't add up to anything close to what an honest game should look like.\"\n\n" +
      "The midway closed at the usual hour, and five people had reason enough to still be somewhere on these grounds well past that. Crane, everyone agrees, ran the fairest show on this whole circuit for thirty years — which made him exactly the kind of man who'd notice the one booth that wasn't.",
    cast: [
      {
        name: "Dexter",
        detail: "The ring-toss barker, running the one booth whose actual numbers never quite matched what an honest game should produce — a discrepancy Crane's own careful recount was only days from making public.",
      },
      {
        name: "Madame Zora",
        detail: "The carnival's fortune-teller, whose late-night readings had a curious habit of steering marks toward one particular booth.",
      },
      {
        name: "Big Tom",
        detail: "The strongman, publicly humiliated by Crane years ago over an old theft accusation neither of them has ever quite let go.",
      },
      {
        name: "Ruthie",
        detail: "Crane's business partner and financial backer — set to inherit sole ownership of the whole carnival outright, the moment Crane was gone.",
      },
      {
        name: "Old Higgins",
        detail: "The carnival's night rigger, checking every ride's brakes by hand before anyone sleeps, every single night. As far as anyone can tell, entirely without motive.",
      },
    ],
  },
  {
    storyId: "ice-vault-expedition",
    sceneText:
      "**A retreating glacier, high above the tree line, meltwater running loud beneath the ice all around you.**\n\n" +
      "Freya has studied this glacier for six field seasons, ever since old survey photographs first convinced her something was sealed deep inside it — something the ice itself had been protecting far longer than anyone thought to look. \"The people who sealed this vault didn't trust stone doors or iron locks,\" she tells you, checking a stake driven into the ice. \"They trusted the ice's own arithmetic — how fast it melts, how much it weighs, how it behaves right up until the moment it doesn't. Get the numbers wrong up here, and the mountain simply keeps its secret a little longer, at your expense.\"\n\n" +
      "Her instruments already tell you two things worth remembering: the ice is melting at a steady 3 centimeters a day, and the ice core's internal temperature reads a bitter -10°C. \"Every measurement out here is a countdown,\" Freya says, shouldering her pack. \"Whether you trust your own arithmetic, or you guess and hope, we're racing the same thaw either way.\"",
    cast: [
      {
        name: "Freya",
        detail: "Your expedition's glaciologist — six field seasons on this ice, and the first to take its melt rate as seriously as its history.",
      },
      {
        name: "The Frost Wardens",
        detail: "The ancient people who sealed this vault. Long gone, but every measurement they left behind still tests the same thing: whether your arithmetic can be trusted completely.",
      },
    ],
  },
  {
    storyId: "architects-folly",
    sceneText:
      "**A half-built skyscraper, floodlights buzzing over silent scaffolding.**\n\n" +
      "Priya, the site's junior structural engineer, meets you at the gate, hard hat still crooked. \"Mr. Reyes is dead, in the site office,\" she says. \"A section of the east wing floor came down earlier tonight — nobody hurt, thank God, just noise and dust. But Reyes had been recalculating the load numbers for that exact section for days. He told me yesterday the beams installed don't match what the blueprints actually call for. He was going to halt the whole project tomorrow morning.\"\n\n" +
      "The site went quiet at the usual hour, and five people had reason enough to still be somewhere on these floors well past that. Reyes, everyone agrees, was the kind of engineer who checked his own arithmetic twice before he'd ever act on it — which made him exactly the kind of man who'd notice a beam that wasn't what it claimed to be.",
    cast: [
      {
        name: "Dana Whitfield",
        detail: "The project's lead contractor, facing ruinous financial penalties — and the loss of the entire contract — if construction halted for a full safety review.",
      },
      {
        name: "Sanjay Kapoor",
        detail: "A junior structural engineer whose own stamp appears on the beam calculations Reyes was about to flag as falsified.",
      },
      {
        name: "Ms. Okafor",
        detail: "The building's developer, already facing bankruptcy over repeated delays, and increasingly desperate for the project to finish on schedule.",
      },
      {
        name: "Grady",
        detail: "The site's safety inspector, publicly humiliated by Reyes months ago over a violation he'd missed — a grudge neither man has ever quite let go.",
      },
      {
        name: "Old Feeny",
        detail: "The night watchman and crane operator, walking the same equipment checks every night for years. As far as anyone can tell, entirely without motive.",
      },
    ],
  },
  {
    storyId: "canyon-of-echoes",
    sceneText:
      "**A deep desert canyon, walls rising sheer on either side, your own footsteps returning to you a half-second late.**\n\n" +
      "Talia has spent four field seasons mapping this canyon's peculiar acoustics, ever since a local guide first told her that sound itself, not stone, guarded whatever was hidden at its heart. \"They didn't carve locks or riddles into these walls,\" she tells you, testing a small drum against the rock. \"They carved the canyon itself into an instrument, and trusted its own physics to keep out anyone too impatient to actually measure what they were hearing.\"\n\n" +
      "Her instruments already tell you two things worth remembering: sound moves through this dry desert air at about 340 meters per second, and a single sharp clap here returns as a clean, unmistakable echo. \"Every marker from here to the canyon's heart tests the same thing,\" Talia says, shouldering her gear. \"Whether you trust the actual numbers an echo gives you, or you just guess at how far away something sounds.\"",
    cast: [
      {
        name: "Talia",
        detail: "Your guide — four field seasons spent mapping this canyon's acoustics, and the first to take its echoes as seriously as its geology.",
      },
      {
        name: "The Echo Keepers",
        detail: "The ancient people who tuned this canyon. Long gone, but every chamber they carved still tests the same thing: whether your arithmetic can be trusted completely.",
      },
    ],
  },
  {
    storyId: "museum-heist",
    sceneText:
      "**A city museum, after hours, one gallery's display case standing empty under emergency lighting.**\n\n" +
      "Odette, a junior security technician, meets you at the staff entrance, badge still in hand. \"Dr. Voss is dead, in the control room,\" she says. \"The Ambrose Diamond is gone from its case — the same case behind a system its own designer swore was unbreakable. Dr. Voss didn't believe that for a second. He'd been recalculating the sensor grid's actual coverage for days, convinced there was a real gap in the math somewhere, not just a story people told themselves.\"\n\n" +
      "The museum closed at the usual hour, and five people had reason enough to still be somewhere in this building well past that. Dr. Voss, everyone agrees, trusted the system's own numbers a great deal more than he trusted anyone's word about how safe it was — which made him exactly the kind of man who'd notice the one gap that mattered.",
    cast: [
      {
        name: "Marcus Webb",
        detail: "The security system's original designer, whose entire reputation rests on a system that just proved breakable.",
      },
      {
        name: "Priya Anand",
        detail: "A rival museum's acquisitions director, quietly known to broker sales for collectors who never ask where a piece really came from.",
      },
      {
        name: "Colette Fischer",
        detail: "The museum's night security guard, with more hands-on knowledge of this exact sensor grid than almost anyone else in the building.",
      },
      {
        name: "Alderman Reeves",
        detail: "The museum's board chair, facing a funding scandal that a conveniently timed insurance payout would go a long way toward covering.",
      },
      {
        name: "Old Baptiste",
        detail: "The museum's night janitor, cleaning the same galleries in the same order for over a decade. As far as anyone can tell, entirely without motive.",
      },
    ],
  },
  {
    storyId: "cartographers-riddle",
    sceneText:
      "**A retired cartographer's study, dust thick on shelves of rolled maps and old surveying instruments.**\n\n" +
      "Marisol, Cornelius Drake's granddaughter, has spent months going through her grandfather's papers since his passing, trying to make sense of one map in particular — his last, and never finished. \"He always said a real map should let anyone check it and get the same answer,\" she tells you, unrolling the map's tattered edge. \"Every measurement on this one checks out perfectly, right up until this corner, which he simply left blank. I don't think that was carelessness. I think he wanted whoever finished it to actually earn the answer.\"\n\n" +
      "Two landmarks anchor the whole map: the old well, and the chapel ruins, exactly 300 meters apart along a straight baseline. \"Every step from here to that blank corner tests the same thing,\" Marisol says, shouldering a satchel of her grandfather's own instruments. \"Whether you trust the actual numbers a measurement gives you, or you just guess at a distance.\"",
    cast: [
      {
        name: "Marisol",
        detail: "Cornelius Drake's granddaughter — new to surveying herself, but determined to finish the one map her grandfather never could.",
      },
      {
        name: "Cornelius Drake",
        detail: "A retired cartographer, meticulous to a fault. Long gone now, but every measurement he left behind still checks out, right up to the blank corner he left on purpose.",
      },
    ],
  },
  {
    storyId: "impossible-angles",
    sceneText:
      "**A formal garden maze, hedges trimmed into impossible, perfect shapes under a grey morning sky.**\n\n" +
      "Beatrix, one of the estate's junior gardeners, meets you at the maze's entrance, still shaking. \"Mr. Sorrel is dead, inside the folly itself,\" she says. \"He designed this whole garden using forced perspective — tricks of angle and distance that make it look impossible from certain spots. He told me last week he'd found something wrong with his own math. Not a mistake — a change. Someone had recalculated part of it, on purpose, and he was going to find out who before he told the estate.\"\n\n" +
      "The garden closes to visitors at the usual hour, and five people had reason enough to still be somewhere on these grounds well past that. Sorrel, everyone agrees, trusted his own careful geometry completely — which made him exactly the kind of man who'd notice the one angle that had been quietly changed.",
    cast: [
      {
        name: "Foreman Callahan",
        detail: "The estate's head gardener, with more hands-on access to the folly's actual hedges than anyone else on the grounds — and, it turns out, a private buyer for whatever moved unseen through them.",
      },
      {
        name: "Lady Pemberton",
        detail: "The estate's owner, facing serious financial trouble — trouble everyone assumed, wrongly, had something to do with tonight.",
      },
      {
        name: "Mr. Ainsley",
        detail: "A rival garden designer, competing with Sorrel for the same prestigious commission, due to be decided within days.",
      },
      {
        name: "Delphine",
        detail: "Sorrel's own apprentice, publicly corrected by him in front of a client just last month — a humiliation she's never quite gotten over.",
      },
      {
        name: "Old Gerty",
        detail: "The estate's groundskeeper, watering the same beds in the same order every evening for years. As far as anyone can tell, entirely without motive.",
      },
    ],
  },
  {
    storyId: "lost-city-numbers",
    sceneText:
      "**A jungle ruin, vines threading through carved stone doorways that haven't opened in centuries.**\n\n" +
      "Itzel has spent three field seasons mapping this lost city, ever since local stories first convinced her its builders — a people she calls the Counting Priests — protected their greatest treasury with nothing but arithmetic. \"They didn't trust locks or guards,\" she tells you, brushing moss from a carved lintel. \"They trusted the count itself. Every doorway here checks whether you actually understand their numbers, or you're only guessing at symbols you don't really understand.\"\n\n" +
      "Her own notes already tell you two things worth remembering: the priests counted in base twenty, not base ten, and they were among the first people anywhere to use a true symbol for zero. \"Every chamber from here to the treasury tests the same thing,\" Itzel says, stepping past the first threshold. \"Whether you trust their arithmetic completely, or you just guess and hope.\"",
    cast: [
      {
        name: "Itzel",
        detail: "Your guide — three field seasons in this ruin, and the first to take the Counting Priests' numerals as seriously as their architecture.",
      },
      {
        name: "The Counting Priests",
        detail: "The vanished people who built this city. Long gone, but every doorway they carved still tests the same thing: whether your arithmetic can be trusted completely.",
      },
    ],
  },
];

export function introForStory(storyId: string): QuestIntro | undefined {
  return QUEST_INTROS.find((i) => i.storyId === storyId);
}
