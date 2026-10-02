window.CC_DATA_PARTS = window.CC_DATA_PARTS || {};
/* Theosophical reflections layer (optional; one toggle hides it). Shown only inside the app, never in
   anything an employer sees. Every quotation was copied from a raw text downloaded in October 2026 and
   checked word for word by script. Sources:
   - The Voice of the Silence (1889): SelfDefinition.Org transcription,
     https://raw.githubusercontent.com/sharnish/SelfDefinition.Org/master/blavatsky/voice-of-the-silence/voice-fragment-1.htm
     (and -2.htm, -3.htm). Only one transcription could be reached. It renders print dashes as spaced en dashes,
     which are shown here as long dashes (—), as in print.
   - The Key to Theosophy (1889): Project Gutenberg 55618, the 1920 ULT verbatim reprint (wording verbatim; its
     pagination differs from the 1889 first edition, so locations are given by Section and subsection heading),
     https://raw.githubusercontent.com/GITenberg/The-Key-to-Theosophy-Being-A-Clear-Exposition-In-The-Form-Of-Question-And-Answer-Of-The-Ethic__55618/master/55618-h/55618-h.htm
   - The Secret Doctrine (1888): sacred-texts transcription of the 1888 text,
     https://raw.githubusercontent.com/jonnyg23/mahabrain/main/sacred_obsidian_vault/the/sd/sd1-0-pr.md (and sd1-0-co.md, sd1-0-in.md)
   - Light on the Path (1888 Redway edition with Notes): Project Gutenberg 14599,
     https://raw.githubusercontent.com/GITenberg/Light-On-The-Path-and-Through-the-Gates-of-Gold_14599/master/14599.txt
     cross-checked with https://raw.githubusercontent.com/sharnish/SelfDefinition.Org/master/blavatsky/light-on-the-path/section-1-text.htm
     (Rule 21: Gutenberg drops the colon in "storm: not till then"; the colon is kept here.)
     Comments: Lucifer Vol. I, Project Gutenberg 60852.
   - Bhagavad-Gita, tr. Annie Besant, 4th ed. (1922) as transcribed on Wikisource, via
     https://raw.githubusercontent.com/ravitejakamalapuram/GitaVerses/main/verses.js (1895 wording not reachable;
     Judge's 1890 recension could not be fetched, so no Judge Gita wording is quoted).
   - W. Q. Judge, The Ocean of Theosophy (1893): Project Gutenberg 54268 (1915 ULT printing).
   - The Golden Stairs: as printed in A. L. Cleather (1922), Project Gutenberg 36373,
     https://raw.githubusercontent.com/GITenberg/H.-P.-BlavatskyA-Great-Betrayal_36373/master/36373-h/36373-h.htm
   - Golden Verses of Pythagoras, tr. N. L. Redfield (1917): Project Gutenberg 69174.
   - Annie Besant, The Changing World (1909): Project Gutenberg 57667,
     https://raw.githubusercontent.com/GITenberg/The-changing-world-and-lectures-to-theosophical-students-Fifteen-lectures-delivered-in-London__57667/master/57667-0.txt
     (the three stages of meditation; "the inspired books of the world", a list that includes the Golden Verses;
     "the value of a brief reading before meditation").
   - Objects: current wording per ts-adyar.org/objects (search results; the page itself was blocked). Objects 1 and 2
     also appear in The Indian Theosophist, Dec. 2024 (fetched), which prints "caste, or colour" with a comma.
     The third Object is confirmed by search results only.
   - Theosophical Order of Service activities and the name "Universal Invocation": The Indian Theosophist, Jan. 2026,
     https://eraaymedia.s3.ap-south-1.amazonaws.com/theosophydocs/wp-content/uploads/2026/04/January-2026-The-Indian-Theosophist.pdf
   - Universal Prayer: NOT fetched (every page with the text was blocked). Wording as shown in search results
     (theosophy.wiki, theosofie.nl). Printings differ and which form is the 1923 original is unconfirmed; the in-app
     note says so and asks her to follow her lodge's card.
   - Motto Devanagari: the standard sandhi of satyāt + nāsti, matching the TS-Adyar transliteration satyan nasti paro
     dharmah (ts-adyar.org/motto, search results); no fetched page showed the Devanagari. */
window.CC_DATA_PARTS.theosophy = {
  label: 'Theosophical reflections',
  toggleOn: 'Theosophical reflections are showing on every page, and you can switch them off here at any time.',
  toggleOff: 'Switch this on to add a daily seed thought, a short passage on each page, optional study tasks in your plan and a Theosophy section in Care.',
  motto: {
    text: 'There is no Religion higher than Truth.',
    sanskrit: 'सत्यान्नास्ति परो धर्मः (satyān nāsti paro dharmaḥ)',
    source: 'H. P. Blavatsky, The Secret Doctrine (1888), Vol. I, title page. On p. xli she spells the Sanskrit SATYAT NASTI PARO DHARMAH and calls it "the motto of the Maharajah of Benares, adopted by the Theosophical Society."',
  },
  epigraphs: {
    today: {
      quote: 'The Teacher can but point the way. The Path is one for all, the means to reach the goal must vary with the Pilgrims.',
      source: 'H. P. Blavatsky, The Voice of the Silence (1889), Fragment III',
      note: 'Your plan changes with your energy each morning, and the direction stays the same.',
    },
    paths: {
      quote: 'Better is one\'s own duty though destitute of merits than the well-executed duty of another. He who doeth the duty laid down by his own nature incurreth not sin.',
      source: 'The Bhagavad-Gita, tr. Annie Besant (4th ed., 1922; first published 1895), Discourse XVIII, v. 47',
      note: 'Choose the lane that suits your own nature and skills, even when another looks more impressive from outside.',
    },
    companies: {
      quote: 'As mankind is essentially of one and the same essence, and that essence is one—infinite, uncreate, and eternal, whether we call it God or Nature—nothing, therefore, can affect one nation or one man without affecting all other nations and all other men.',
      source: 'H. P. Blavatsky, The Key to Theosophy (1889), Section III, “The Common Origin of Man”',
      note: 'Behind every name on this list are people, and the way a company treats them is the first thing to check.',
    },
    abroad: {
      quote: 'To form the nucleus of a Universal Brotherhood of Humanity without distinction of race, colour, or creed.',
      source: 'H. P. Blavatsky, The Key to Theosophy (1889), Section III, “The Objects of the Society” (the first Object as worded in 1889)',
      note: 'Colleagues in another country belong to the same human family, and your skills and languages travel with you.',
    },
    search: {
      quote: 'Seek out the way. … Seek the way by retreating within. … Seek the way by advancing boldly without.',
      source: 'Mabel Collins, Light on the Path (1888 edition), Part I, Rules 17 to 19',
      note: 'Spend a few quiet minutes deciding what you are looking for, then search boldly.',
    },
    cv: {
      quote: 'SHILA, the key of Harmony in word and act, the key that counterbalances the cause and the effect, and leaves no further room for Karmic action.',
      source: 'H. P. Blavatsky, The Voice of the Silence (1889), Fragment III (the second of the golden keys)',
      note: 'Let each line on your CV describe work you really did, so that word and act stay in harmony.',
    },
    letters: {
      quote: 'Speech comes only with knowledge. Attain to knowledge and you will attain to speech.',
      source: 'Mabel Collins, Light on the Path (1888 edition), Part II, Rule 13',
      note: 'Ten minutes of reading about the company and the role can give you the words for a short, true letter.',
    },
    tracker: {
      quote: 'Thy business is with the action only, never with its fruits; so let not the fruit of action be thy motive, nor be thou to inaction attached.',
      source: 'The Bhagavad-Gita, tr. Annie Besant (4th ed., 1922; first published 1895), Discourse II, v. 47',
      note: 'Log each action here and let the replies come in their own time.',
    },
    interview: {
      quote: 'Have patience, Candidate, as one who fears no failure, courts no success.',
      source: 'H. P. Blavatsky, The Voice of the Silence (1889), Fragment II',
      note: 'Practise until the answers feel familiar, then walk in without needing a particular result.',
    },
    offer: {
      quote: 'Before thou takest thy first step learn to discern the real from the false, the ever-fleeting from the everlasting.',
      source: 'H. P. Blavatsky, The Voice of the Silence (1889), Fragment II',
      note: 'Before you accept, separate what will last, such as the employer’s record and the written terms, from the glow of being chosen.',
    },
    care: {
      quote: 'Let thy Soul lend its ear to every cry of pain like as the lotus bares its heart to drink the morning sun.',
      source: 'H. P. Blavatsky, The Voice of the Silence (1889), Fragment I',
      note: 'This compassion faces outward first, and it does not leave you out. Blavatsky counts justice to oneself, “not more but not less than to others”, among the fundamental rules. This page is a place to listen to your own pain kindly.',
    },
  },
  seeds: [
    {
      quote: 'Have perseverance as one who doth for evermore endure.',
      source: 'H. P. Blavatsky, The Voice of the Silence (1889), Fragment II',
      reflection: 'Perseverance can be steady and unhurried. One application or one message today keeps the thread unbroken.',
    },
    {
      quote: 'Work as those work who are ambitious. Respect life as those do who desire it. Be happy as those are who live for happiness.',
      source: 'Mabel Collins, Light on the Path (1888 edition), Part I, Rule 4',
      reflection: 'Give today’s tasks your full care without staking your peace on the result. Then do one thing simply because you enjoy it.',
    },
    {
      quote: 'Learn that no efforts, not the smallest—whether in right or wrong direction—can vanish from the world of causes.',
      source: 'H. P. Blavatsky, The Voice of the Silence (1889), Fragment II',
      reflection: 'This is karma at its plainest, cause and effect. The small tasks you do today set causes in motion, even when no reply shows yet.',
    },
    {
      quote: 'Perform action, O Dhananjaya, dwelling in union with the divine, renouncing attachments and balanced evenly in success and failure: equilibrium is called yoga.',
      source: 'The Bhagavad-Gita, tr. Annie Besant (4th ed., 1922; first published 1895), Discourse II, v. 48',
      reflection: 'Do the day’s tasks fully and let success and failure weigh the same. That evenness is something you can practise in every application.',
    },
    {
      quote: 'All good and evil things in humanity have their roots in human character, and this character is, and has been, conditioned by the endless chain of cause and effect. But this conditioning applies to the future as well as to the present and the past.',
      source: 'H. P. Blavatsky, The Key to Theosophy (1889), Section XII, “The Relations of the T.S. to Political Reforms”',
      reflection: 'Cause and effect run forward as well as back. What you do this week shapes the weeks ahead, whatever came before.',
    },
    {
      quote: 'KSHANTI, patience sweet, that nought can ruffle.',
      source: 'H. P. Blavatsky, The Voice of the Silence (1889), Fragment III (the third of the golden keys)',
      reflection: 'Waiting for replies is part of every search. Let today’s patience be gentle with yourself as well as with the recruiters.',
    },
    {
      quote: 'Grow as the flower grows, unconsciously, but eagerly anxious to open its soul to the air. So must you press forward to open your soul to the eternal.',
      source: 'Mabel Collins, Light on the Path (1888 edition), Part I, from the text of Rule 8',
      reflection: 'Growth in a hard season is often quiet. Stay open to new ideas about your work, including ones you are not ready to act on yet.',
    },
    {
      quote: 'Thou canst create this "day" thy chances for thy "morrow."',
      source: 'H. P. Blavatsky, The Voice of the Silence (1889), Fragment II',
      reflection: 'Whatever happened before, today is where you can act. One tidy CV, one follow-up or one good rest all count towards tomorrow.',
    },
    {
      quote: 'One of the fundamental rules of Theosophy is, justice to oneself—viewed as a unit of collective humanity, not as a personal self-justice, not more but not less than to others; unless, indeed, by the sacrifice of the one self we can benefit the many.',
      source: 'H. P. Blavatsky, The Key to Theosophy (1889), Section XII, “On Self-Sacrifice”',
      reflection: 'You are part of the humanity you wish well. Give your own rest, meals and sleep the same fairness you would give anyone else.',
    },
    {
      quote: 'The path that leadeth on, is lighted by one fire—the light of daring, burning in the heart. The more one dares, the more he shall obtain.',
      source: 'H. P. Blavatsky, The Voice of the Silence (1889), Fragment III',
      reflection: 'Daring can be small. Today it might be one message to someone you have not met, or one application to a role that feels a size too big.',
    },
    {
      quote: 'Seek it not by any one road. … None alone can take the disciple more than one step onward. All steps are necessary to make up the ladder.',
      source: 'Mabel Collins, Light on the Path (1888 edition), Part I, Rule 20 and its text',
      reflection: 'This is one reason to keep three lanes open. Clinical, quality and training roles are different roads, and a step on any of them counts.',
    },
    {
      quote: 'United to the Pure Reason one abandoneth here both good and evil deeds; therefore cleave thou to yoga; yoga is skill in action.',
      source: 'The Bhagavad-Gita, tr. Annie Besant (4th ed., 1922; first published 1895), Discourse II, v. 50',
      reflection: 'In the Gita, skill in action means acting fully while staying free of the pull of the result. Bring the care you gave to installations and training to one task today, then let its outcome go.',
    },
    {
      quote: 'If Sun thou can\'st not be, then be the humble planet.',
      source: 'H. P. Blavatsky, The Voice of the Silence (1889), Fragment II',
      reflection: 'On a low day, a smaller light is enough. Do the one small task and let it count fully.',
    },
    {
      quote: 'The personality with its Skandhas is ever changing with every new birth. It is, as said before, only the part played by the actor (the true Ego) for one night.',
      source: 'H. P. Blavatsky, The Key to Theosophy (1889), Section VIII, “Why do we not Remember our Past Lives?”',
      reflection: 'In Blavatsky’s image the actor’s part is a whole lifetime, and a job title is a much smaller part than that. You, the one who played it with care and skill, are still here between roles.',
    },
    {
      quote: 'Look for the flower to bloom in the silence that follows the storm: not till then.',
      source: 'Mabel Collins, Light on the Path (1888 edition), Part I, Rule 21',
      reflection: 'The weeks after a retrenchment can feel stormy. Let today be quiet and unhurried, and leave the looking for results to another day.',
    },
    {
      quote: 'Be like the Ocean which receives all streams and rivers. The Ocean\'s mighty calm remains unmoved; it feels them not.',
      source: 'H. P. Blavatsky, The Voice of the Silence (1889), Fragment II',
      reflection: 'Rejections, silences and good news all arrive in the same inbox. The surface may stir with each one while the deeper calm stays where it is.',
    },
    {
      quote: 'This second assertion of the Secret Doctrine is the absolute universality of that law of periodicity, of flux and reflux, ebb and flow, which physical science has observed and recorded in all departments of nature.',
      source: 'H. P. Blavatsky, The Secret Doctrine (1888), Vol. I, Proem, p. 17',
      reflection: 'A search has busy weeks and quiet ones, like every natural rhythm. A quiet week is part of the cycle, and a good time to rest and study.',
    },
    {
      quote: 'Without doubt, O mighty-armed, the mind is hard to curb and restless; but it may be curbed by constant practice and by dispassion.',
      source: 'The Bhagavad-Gita, tr. Annie Besant (4th ed., 1922; first published 1895), Discourse VI, v. 35',
      reflection: 'If your mind keeps returning to the retrenchments or to tomorrow’s interview, that is how minds work. Bring it back gently, as often as it takes.',
    },
    {
      quote: '"Ere the gold flame can burn with steady light, the lamp must stand well guarded in a spot free from all wind."',
      source: 'H. P. Blavatsky, The Voice of the Silence (1889), Fragment III, where her footnote cites the Bhagavad Gita',
      reflection: 'Before a search block, close the extra tabs and silence everything except recruiter calls. A steady flame needs a sheltered place.',
    },
    {
      quote: 'Out of the silence that is peace a resonant voice shall arise. And this voice will say, It is not well; thou hast reaped, now thou must sow.',
      source: 'Mabel Collins, Light on the Path (1888 edition), Part II, opening',
      reflection: 'Sowing follows rest, in its own time. When you feel ready, choose one seed to plant, such as an application or a message to a former colleague. On a rest day, choosing it is enough.',
    },
    {
      quote: 'And also it is not until a man begins to try to teach others, that he discovers his own ignorance and tries to remove it.',
      source: 'H. P. Blavatsky, The Key to Theosophy (1889), Section XII, “What a Theosophist ought not to do”',
      reflection: 'You have spent years teaching doctors and sonographers, and teaching is also how you learn. Explaining your work aloud to a friend today could sharpen an interview answer.',
    },
    {
      quote: 'The holy germs that sprout and grow unseen in the disciple\'s soul, their stalks wax strong at each new trial, they bend like reeds but never break, nor can they e\'er be lost.',
      source: 'H. P. Blavatsky, The Voice of the Silence (1889), Fragment III',
      reflection: 'Much of what grows in a hard season grows out of sight, such as steadiness and clearer judgement. It counts on the days when nothing shows.',
    },
    {
      quote: 'There is a natural melody, an obscure fount in every human heart. It may be hidden over and utterly concealed and silenced—but it is there. At the very base of your nature you will find faith, hope, and love.',
      source: 'Mabel Collins, Light on the Path (1888 edition), Notes, Note on Part II, Rule 5',
      reflection: 'On a heavy day this can be hard to feel. You can trust that it is there without feeling it today.',
    },
    {
      quote: 'All undertakings indeed are clouded by defects as fire by smoke.',
      source: 'The Bhagavad-Gita, tr. Annie Besant (4th ed., 1922; first published 1895), Discourse XVIII, v. 48',
      reflection: 'Every CV and every letter has some small flaw. Send the good-enough version and let the smoke be.',
    },
    {
      quote: 'Step out from sunlight into shade, to make more room for others.',
      source: 'H. P. Blavatsky, The Voice of the Silence (1889), Fragment II',
      reflection: 'In a group chat or at a meeting, give someone quieter the space to speak, and listen well. In interviews and applications, the sunlight is yours to stand in.',
    },
    {
      quote: 'Desire to sow no seed for your own harvesting; desire only to sow that seed the fruit of which shall feed the world.',
      source: 'Mabel Collins, Light on the Path (1888 edition), the essay “Karma”',
      reflection: 'Help given with no thought of return is still worth giving. Share one opening or one useful tip with another job seeker today.',
    },
    {
      quote: 'Prepare, and be forewarned in time. If thou hast tried and failed, O dauntless fighter, yet lose not courage: fight on and to the charge return again, and yet again.',
      source: 'H. P. Blavatsky, The Voice of the Silence (1889), Fragment III',
      reflection: 'An application that did not work out is one attempt among many. Prepare one thing today and try again when you are ready.',
    },
    {
      quote: 'But if thou can\'st prepare, then have no fear.',
      source: 'H. P. Blavatsky, The Voice of the Silence (1889), Fragment III',
      reflection: 'If you catch yourself rehearsing a rejection that has not happened, turn the worry into one piece of preparation, such as a practice answer or a tidied CV line. Then let tomorrow wait for tomorrow.',
    },
    {
      quote: 'The Dhyana gate is like an alabaster vase, white and transparent; within there burns a steady golden fire, the flame of Prajna that radiates from Atman.\nThou art that vase.',
      source: 'H. P. Blavatsky, The Voice of the Silence (1889), Fragment III',
      reflection: 'Whatever a rejection says about a CV, it says nothing about the light within you. Sit with that for a minute before you begin.',
    },
    {
      quote: 'The ground may be rough and dirty, or full of rich flowers whose pollen stains, and of sweet substances that cling and become attachments—but overhead there is always the free sky.',
      source: 'Mabel Collins, Light on the Path (1888 edition), the essay “Karma”',
      reflection: 'Rough weeks and hopeful weeks both pass underfoot. Step outside for a minute today and look up.',
    },
    {
      quote: 'Be of good cheer, O daring pilgrim "to the other shore."',
      source: 'H. P. Blavatsky, The Voice of the Silence (1889), Fragment III',
      reflection: 'Cheerfulness belongs in the middle of a search too. Find one small pleasure today and enjoy it without guilt.',
    },
  ],
  moments: {
    applied: 'You have done your part with care, and the reply is outside your hands. Let this one go for today.',
    followup: 'A short, courteous follow-up is right speech in practice. Now let it rest.',
    interview: 'This one is at the interview stage. Whatever the panel decides, you are the same person, with the same skill.',
    offer: 'An offer, and you worked for it. Enjoy today, then weigh the employer’s record and the written terms before you say yes.',
    closed: 'This one is closed. No effort vanishes from the world of causes, and the care you gave it still counts.',
    beforeSend: 'In the words of Light on the Path, pause and consider awhile. Read it once more for truth, kindness and the right name.',
    dayDone: 'Rest now is the ebb that follows the flow, and both belong to a steady search.',
  },
  pool: [
    {
      id: 'theo-seed',
      title: 'Sit with today’s seed thought',
      sub: 'Five quiet minutes with one phrase. The Theosophy section in Care shows how.',
      minutes: 5,
      energy: ['low', 'okay', 'good'],
      href: '#care',
      care: true,
    },
    {
      id: 'theo-review',
      title: 'Evening review of the day',
      sub: 'Three minutes before sleep, or first thing tomorrow if that suits you better. Note what you did, what can wait and one kind moment, as a fair friend would.',
      minutes: 3,
      energy: ['low', 'okay', 'good'],
      href: '#care',
      care: true,
    },
    {
      id: 'theo-read',
      title: 'Read one page of a theosophical text',
      sub: 'The Voice of the Silence, Light on the Path or The Key to Theosophy. One page, then stop.',
      minutes: 10,
      energy: ['low', 'okay'],
      href: '#care',
      care: true,
    },
    {
      id: 'theo-service',
      title: 'Pass on one opening to another job seeker',
      sub: 'An opening you came across that fits a friend or former colleague. A small act of brotherhood that also keeps you in touch with your field.',
      minutes: 10,
      energy: ['okay', 'good'],
      href: '#search',
    },
    {
      id: 'theo-stairs',
      title: 'Read the Golden Stairs slowly',
      sub: 'Once through, then carry one step with you for the day.',
      minutes: 5,
      energy: ['low', 'okay', 'good'],
      href: '#care',
      care: true,
    },
  ],
  interviewCentering: 'Before you practise, take one minute. Sit with both feet on the floor, close your eyes if you like, and let out three slow breaths. Remember that the person asking the questions shares the same life as you. As the Notes to Light on the Path put it, “Intelligence is impartial: no man is your enemy: no man is your friend. All alike are your teachers.” Say to yourself, “I will prepare well and answer truthfully. The result is not mine to hold.” Then open your eyes and begin with the first question.',
  care: {
    intro: 'This section gathers the theosophical side of Care, with a seed thought for each day, practices from the tradition, answers to heavy thoughts and texts for slow study. Use what helps and leave the rest. All of it stays inside this app and never appears in anything an employer sees. The helplines are at the end of this page, whenever you need them.',
    seedNote: 'Read today’s seed thought twice, slowly. Let your breath settle and rest your attention on a single phrase for three to five minutes. When the mind drifts to emails or worries, bring it back to the phrase without blame. Finish by asking what the phrase could mean for one thing you will do today.',
    balance: 'Study and meditation sit alongside the helplines, counselling and any medicine a doctor prescribes, and they never replace them. If heavy thoughts last for days, or ever come with not wanting to be here, please call Tele-MANAS on 14416 or another helpline first. Your practice will still be here afterwards.',
    objects: {
      title: 'The three Objects',
      intro: 'This is how the Theosophical Society (Adyar) words its three Objects today. Other theosophical groups state their aims in their own words, and Blavatsky’s 1889 wording in The Key to Theosophy differs again. Beside each is one thing it can mean while you look for work.',
      items: [
        {
          object: 'To form a nucleus of the Universal Brotherhood of Humanity, without distinction of race, creed, sex, caste or colour.',
          forYou: 'Recruiters, interviewers and fellow applicants all belong to this brotherhood, so a kind, clear message to a stranger is a small practice of the first Object.',
        },
        {
          object: 'To encourage the study of Comparative Religion, Philosophy and Science.',
          forYou: 'The patient study you bring to these texts is the same habit that can carry you through a new course or an unfamiliar product.',
        },
        {
          object: 'To investigate unexplained laws of Nature and the powers latent in man.',
          forYou: 'In everyday terms this can include capacities you have not used yet. A job search often calls on some of them, such as patience with silence or the courage to try a new lane.',
        },
      ],
      source: 'The Theosophical Society (Adyar), the three Objects in their current wording (ts-adyar.org/objects; Objects 1 and 2 as also printed in The Indian Theosophist, December 2024)',
    },
    prayer: {
      title: 'The Universal Prayer (Universal Invocation)',
      lines: [
        'O Hidden Life, vibrant in every atom;',
        'O Hidden Light, shining in every creature;',
        'O Hidden Love, embracing all in Oneness;',
        'May each who feels himself as one with Thee,',
        'Know he is therefore one with every other.',
      ],
      source: 'Annie Besant, 1923. Used at meetings of the Theosophical Society (Adyar), including Indian Section gatherings.',
      note: 'Annie Besant wrote this prayer in 1923. Printings differ. Many lodges today say “May all who feel themselves as one with Thee, / Know they are therefore one with every other,” while some older printings, such as the 1930 Lodge Procedure Book of the American Section, read “May each, who feels himself as one with Thee, / Know he is therefore one with every other.” Capitals and punctuation also vary. This page could not be checked against a printed copy, so if the card at your lodge reads differently, follow the card. Some theosophical groups do not use this prayer.',
    },
    practices: [
      {
        name: 'Seed thought',
        how: 'Use the timer on today’s seed thought card above, following the steps written there. Three minutes is enough on a low day.',
        minutes: 5,
        source: 'Meditation on a single idea. The Bhagavad-Gita (VI.35, tr. Besant) says the restless mind “may be curbed by constant practice and by dispassion”. Annie Besant’s The Changing World (1909) describes three stages, which are steadying the wandering mind, fixing it on one thought and then contemplating that thought.',
      },
      {
        name: 'Evening review',
        how: 'Before sleep, look back over the day for two or three minutes and ask the question from the Golden Verses: “What have I omitted and what done?” Note one thing you did, one thing that can wait for tomorrow and one kind moment, given or received. Answer as a fair friend would, then let the day go. If the review starts to circle back to old hurts, stop there and do two minutes of the breathing exercise instead.',
        minutes: 3,
        source: 'The Golden Verses of Pythagoras (tr. N. L. Redfield from Fabre d’Olivet, 1917), the lines on Perfection. Annie Besant named the Golden Verses among “the inspired books of the world” in The Changing World (1909).',
      },
      {
        name: 'The Golden Stairs, read slowly',
        how: 'Read the Golden Stairs below once, slowly, aloud if you can. Then choose one step, such as “a readiness to give and receive advice and instruction”, and carry only that phrase through the day. Tomorrow, take the next step.',
        minutes: 5,
        source: '“The Golden Stairs”, given to H. P. Blavatsky’s pupils (text as printed by A. L. Cleather, 1922)',
      },
      {
        name: 'Wishing other job seekers well',
        how: 'Bring to mind three people who are also looking for work, such as a former colleague, a friend or someone whose post you read. Wish each of them well by name, silently, for steady work and a calm mind. If you can, do one practical thing for one of them afterwards.',
        minutes: 3,
        source: 'The first Object of the Theosophical Society, universal brotherhood',
      },
      {
        name: 'One small act of service',
        how: 'Pass on an opening that suits someone else, answer a question in a job seekers’ group, or give a younger engineer or sonographer ten minutes of advice. Expect nothing back. Service like this is also how people in your field come to know you.',
        minutes: 10,
        source: 'The Voice of the Silence (1889), Fragment II, and the essay “Karma” in Light on the Path',
      },
      {
        name: 'Study in small doses',
        how: 'Read one page of a theosophical text, or one Rule of Light on the Path, then stop. Copy out one sentence that stays with you. If you would like company, a weekly lodge study class or an online study circle can help.',
        minutes: 10,
        source: 'The lodge study-class tradition, and Annie Besant, The Changing World (1909), on the value of a brief reading before meditation',
      },
    ],
    reframes: [
      {
        thought: 'Is this my karma?',
        reframe: 'Blavatsky was asked whether hardships that fall on many people at once are each person’s own merited, individual karma. She answered that they cannot be read that strictly. She spoke instead of the karma that nations and the whole world share, which theosophists call Distributive Karma and trace to humanity’s interdependence. A retrenchment is not a verdict on your worth. The decisions were made by several people inside each company, and in theosophical terms the part of cause and effect that is yours is what you do next.',
        quote: 'No, they cannot be so strictly defined in their effects as to show that each individual environment, and the particular conditions of life in which each person finds himself, are nothing more than the retributive Karma which the individual generated in a previous life. … It is held as a truth among Theosophists that the interdependence of Humanity is the cause of what is called Distributive Karma, and it is this law which affords the solution to the great question of collective suffering and its relief.',
        source: 'H. P. Blavatsky, The Key to Theosophy (1889), Section XI, “What is Karma?”',
      },
      {
        thought: 'Maybe it was meant to be.',
        reframe: 'Judge asks almost this question and answers that karma is not fatalism. In the same chapter he says what matters is how we think and act now, under present circumstances, “no matter what they are”. This week’s applications, messages and rest are new causes, and they are yours to choose.',
        quote: 'Is Karma only fate under another name, an already fixed and formulated destiny from which no escape is possible, and which therefore might make us careless of act or thought that cannot affect destiny? It is not fatalism.',
        source: 'W. Q. Judge, The Ocean of Theosophy (1893), Chapter XI',
      },
      {
        thought: 'Without a job title, who am I?',
        reframe: 'Blavatsky separates the simple sense of being yourself from the name and title you carry. Clinical Application Specialist was a part you played well. The one who played it, with your patience and your ear for people, stays with you when a contract ends.',
        quote: 'We distinguish between the simple fact of self-consciousness, the simple feeling that “I am I,” and the complex thought that “I am Mr. Smith” or “Mrs. Brown.”',
        source: 'H. P. Blavatsky, The Key to Theosophy (1889), Section II, “The Difference between Theosophy and Spiritualism”',
      },
      {
        thought: 'I am alone in this.',
        reframe: 'In theosophical terms the deepest Self is shared, like sunlight that falls on everyone. On the ground, that can mean one call to a friend, a lodge meeting or a helpline today. Many people are searching for work alongside you this week.',
        quote: 'Atma, the “Higher Self,” is neither your Spirit nor mine, but like sunlight shines on all.',
        source: 'H. P. Blavatsky, The Key to Theosophy (1889), Section VIII, “On Individuality and Personality”',
      },
      {
        thought: 'Nothing is moving.',
        reframe: 'Silence from employers is hard to sit through. Collins writes about an inner silence, and her point holds here too. What you build while you wait, such as patience, practice and a sharper CV, stays with you. Keep doing your small daily part and judge the week by what you did.',
        quote: 'The silence may last a moment of time or it may last a thousand years. But it will end. Yet you will carry its strength with you.',
        source: 'Mabel Collins, Light on the Path (1888 edition), Part I, text after Rule 21',
      },
      {
        thought: 'I am angry at how I was treated.',
        reframe: 'Anger after two retrenchments in a row is a fair response, and you can name it fully in your journal or to a friend. Blavatsky’s advice to let go of revenge and gossip can help keep the injury from following you into the next role. In interviews, one calm sentence about the business decision is enough.',
        quote: 'Never to make yourself the echo of anything you may hear against another, nor harbour revenge against those who happen to injure you.',
        source: 'H. P. Blavatsky, The Key to Theosophy (1889), Section XII, “What a Theosophist ought not to do”',
      },
      {
        thought: 'A real student of Theosophy would not be this shaken.',
        reframe: 'Equanimity grows slowly, over many trials. The Voice of the Silence pictures the disciple’s growth as stalks that grow strong at each trial and bend like reeds without breaking. Feeling hurt by a retrenchment is human. Study and practice can steady you over time, alongside grief, rest and support from other people.',
        quote: 'The holy germs that sprout and grow unseen in the disciple\'s soul, their stalks wax strong at each new trial, they bend like reeds but never break, nor can they e\'er be lost.',
        source: 'H. P. Blavatsky, The Voice of the Silence (1889), Fragment III',
      },
      {
        thought: 'Others have achieved so much more than me.',
        reframe: 'Blavatsky measures effort by what a person can do in their circumstances. Given what you have had to carry this year, doing what you can is a full measure.',
        quote: 'Fair-minded people, at any rate, ought to remember that the man who does all he can, does as much as he who has achieved the most, in this world of relative possibilities.',
        source: 'H. P. Blavatsky, The Key to Theosophy (1889), Section IV, “On Self-Improvement”',
      },
      {
        thought: 'I am not doing enough.',
        reframe: 'Blavatsky wrote this about members’ work for the Society, and it applies to a search too. The weekly goals are an upper limit. In a low-energy week, less is a fair offering.',
        quote: 'No one is asked to give more than he can afford, whether in devotion, time, work or money.',
        source: 'H. P. Blavatsky, The Key to Theosophy (1889), Section XII, “What a Theosophist ought not to do”',
      },
    ],
    stairs: {
      title: 'The Golden Stairs',
      text: 'Behold the truth before you! a clean life, an open mind, a pure heart, an eager intellect, an unveiled spiritual perception, a brotherliness for one\'s co-disciple, a readiness to give and receive advice and instruction, a loyal sense of duty to the Teacher, a willing obedience to the behests of TRUTH, once we have placed our confidence in, and believe that Teacher to be in possession of it; a courageous endurance of personal injustice, a brave declaration of principles, a valiant defence of those who are unjustly attacked, and a constant eye to the ideal of human progression and perfection which the secret science (Gupta Vidya) depicts—these are the golden stairs up the steps of which the learner may climb to the Temple of Divine Wisdom.',
      source: 'Given to H. P. Blavatsky’s pupils; text as printed by A. L. Cleather (1922)',
      note: 'Take one step at a time, as a quality to practise for a day or a week. Courageous endurance is a strength you can choose, and it never asks you to call unfair treatment fair. A later revised version of the text reads “a brotherliness for all” in place of “a brotherliness for one\'s co-disciple”.',
    },
    reading: [
      {
        title: 'The Voice of the Silence (1889)',
        author: 'H. P. Blavatsky',
        why: 'Three short fragments on patience, compassion and the Path. A page a day is plenty.',
        url: 'https://www.theosociety.org/pasadena/voice/voice.htm',
      },
      {
        title: 'Light on the Path (1885)',
        author: 'Mabel Collins',
        why: 'Short rules for the inner life, with the Notes and the essay on karma. Read one Rule at a sitting.',
        url: 'https://www.gutenberg.org/ebooks/14599',
      },
      {
        title: 'The Key to Theosophy (1889)',
        author: 'H. P. Blavatsky',
        why: 'Plain questions and answers on the Self, karma and brotherhood, in Blavatsky’s own words.',
        url: 'https://www.gutenberg.org/ebooks/55618',
      },
      {
        title: 'The Ocean of Theosophy (1893)',
        author: 'W. Q. Judge',
        why: 'A compact survey of the teachings in clear prose, read across the theosophical branches.',
        url: 'https://www.gutenberg.org/ebooks/54268',
      },
      {
        title: 'The Bhagavad-Gita, a recension (1890)',
        author: 'W. Q. Judge',
        why: 'Judge’s prose version, a good companion for action without attachment to its fruits.',
        url: 'https://www.theosociety.org/pasadena/gita/bg-eg-hp.htm',
      },
      {
        title: 'The Secret Doctrine (1888)',
        author: 'H. P. Blavatsky',
        why: 'Her major work. Begin with the Proem and take it in small doses.',
        url: 'https://www.theosociety.org/pasadena/sd/sd-hp.htm',
      },
    ],
    community: [
      {
        name: 'Indian Section of the Theosophical Society',
        what: 'The national body, based in Varanasi. There are active lodges in Hyderabad and Secunderabad. The Section’s website lists federations, lodges and programmes, so you can find your nearest lodge and its current meeting times there.',
        url: 'https://theosophy-india.org/',
        region: 'india',
      },
      {
        name: 'Theosophical Order of Service, India',
        what: 'The service wing linked to the Society. Local groups do health, education, old-age support and relief work, a concrete way to practise brotherhood alongside the search.',
        url: 'https://indiatos.org/',
        region: 'india',
      },
      {
        name: 'Theosophy India on YouTube',
        what: 'Free recorded talks and regular programmes from the Indian Section, good for a low-energy evening.',
        url: 'https://www.youtube.com/channel/UCmghC_GjlOGKHR90TcD6peQ',
        region: 'india',
      },
      {
        name: 'United Lodge of Theosophists, India',
        what: 'For study in the ULT tradition, which reads Blavatsky and Judge. Its lodges meet in Mumbai and Bengaluru.',
        url: 'https://www.ultindia.org/',
        region: 'india',
      },
      {
        name: 'The Theosophical Society, Adyar',
        what: 'The international headquarters in Chennai, with links to Sections worldwide, the Adyar Library and the annual International Convention.',
        url: 'https://www.ts-adyar.org/',
        region: 'both',
      },
      {
        name: 'Theosophical University Press Online',
        what: 'Free full texts of Blavatsky, Judge and others from the Pasadena tradition, including The Voice of the Silence and Light on the Path.',
        url: 'https://www.theosociety.org/pasadena/ts/tup-onl.htm',
        region: 'both',
      },
      {
        name: 'United Lodge of Theosophists',
        what: 'ULT lodges and online study around the world, based on the writings of Blavatsky and Judge.',
        url: 'https://theosophyult.com/',
        region: 'global',
      },
      {
        name: 'Theosophical Society in America',
        what: 'Online study courses, talks and a free Daily Seed Thought, useful wherever you are.',
        url: 'https://www.theosophical.org/',
        region: 'global',
      },
    ],
  },
};
