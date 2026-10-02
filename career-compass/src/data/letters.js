window.CC_DATA_PARTS = window.CC_DATA_PARTS || {};
window.CC_DATA_PARTS.letters = {
  intro: 'Short, ready-to-edit messages for each step of your search, from applying to following up after interviews. Fill in a few boxes, read it once in your own voice, and change anything that does not sound like you.',

  fields: {
    company: { label: 'Company', placeholder: 'e.g. GE HealthCare' },
    role: { label: 'Role title', placeholder: 'e.g. Clinical Application Specialist', hint: 'Copy it exactly as the advert writes it' },
    contact: { label: 'Their name', placeholder: 'e.g. Priya Sharma', hint: 'Leave blank if you do not know it' },
    source: { label: 'Where you saw the role', placeholder: 'e.g. Naukri, LinkedIn, a referral' },
    why: { label: 'Why this company, in one line', placeholder: 'e.g. your long presence in India and your work in point-of-care ultrasound', hint: 'Something true and specific: a product you know, their Hyderabad centre, a value they state' },
    mutual: { label: 'Shared connection or ex-colleague', placeholder: 'e.g. Ravi Kumar', hint: 'Someone you both know. If there is no one, edit the first line of the message.' },
    topic: { label: 'Something you discussed', placeholder: 'e.g. how the team trains new users', hint: 'One real point from the conversation' },
    interviewDate: { label: 'Interview day', placeholder: 'e.g. Tuesday', hint: 'For a status check a week or more later, a date reads better than a weekday' },
    skill: { label: 'One key requirement from the job', placeholder: 'e.g. product demonstrations to clinicians', hint: 'Pick one you clearly meet, in the advert’s own words' },
    newRole: { label: 'Role you accepted elsewhere', placeholder: 'e.g. Product Specialist' },
  },

  templates: [
    // ---------- Apply ----------
    {
      id: 'cover',
      label: 'Cover letter',
      group: 'Apply',
      kind: 'apply',
      when: 'When the advert asks for one, when you write to a hiring manager directly, or when your CV needs a little context, such as a change of field.',
      uses: ['company', 'role', 'contact', 'source', 'skill', 'why'],
      docx: true,
      logAs: 'applied',
      body: `{{today}}

{{greeting}}

I am applying for the {{role}} position at {{company}}, which I found through {{source}}. {{pitch}}

{{trackPara}}

The role calls for {{skill}}. [One true example from your work that shows this, with a number if you have one.] I also work comfortably in English, Hindi, Telugu and Odia, which has helped me support users and partner teams from different regions.

What draws me to {{company}} is {{why}}. At this stage of my career, I am looking for a long-term role with an established team, where I can keep learning and build on what I already know.

{{availabilityLine}} I have attached my CV and would welcome the chance to discuss how my experience could support your team in this role.

Thank you for your time and consideration.

Kind regards,
{{signature}}`,
      tips: [
        `Add the Job ID after the role title if the advert has one, and use three to five of the advert’s own words where they are true for you.`,
        `Applications on Naukri or LinkedIn rarely need a cover letter. Keep this one for direct emails, referrals and adverts that ask for it.`,
        `You do not need to mention the two short recent roles here. If you choose to, or if you are asked, one calm sentence is enough, for example "My two most recent roles were closed by the employers for business reasons, and I am now looking for a long-term role with an established team."`,
      ],
    },
    {
      id: 'apply-email',
      label: 'Application email',
      group: 'Apply',
      kind: 'apply',
      when: 'When you send your CV straight to a recruiter or hiring manager by email.',
      uses: ['company', 'role', 'contact', 'source'],
      logAs: 'applied',
      subject: 'Application: {{role}} | {{me}} | Available immediately',
      body: `{{greeting}}

I would like to apply for the {{role}} position at {{company}}, which I found through {{source}}. My CV is attached.

{{pitch}} I would bring your team {{strengths}}.

I am looking for a long-term role with an established company, and this position fits my experience well. {{availabilityLine}}

I would be glad to speak at a time that suits you. Thank you for considering my application.

Kind regards,
{{signature}}`,
      tips: [
        `Write to one named person at a time, and keep other recruiters out of the To and CC lines.`,
        `Attach one CV only, named Smitapragyan_Patro_CV_[Role], and add the Job ID to the subject line if there is one.`,
        `Save it to the tracker as applied, and you will get a gentle reminder to follow up in a week.`,
      ],
    },
    {
      id: 'recruiter-reply',
      label: 'Reply to a recruiter',
      group: 'Apply',
      kind: 'other',
      when: 'When a recruiter calls, emails or messages you about a role and you would like to go ahead.',
      uses: ['company', 'role', 'contact'],
      logAs: 'applied',
      subject: '{{role}} at {{company}} | {{me}} | CV attached',
      body: `{{greeting}}

Thank you for getting in touch about the {{role}} role at {{company}}. I am interested and would be glad to take it forward.

{{pitch}} I have attached my CV for your review.

{{availabilityLine}} I am happy to speak at a time that suits you. Please let me know the next steps.

Kind regards,
{{signature}}`,
      tips: [
        `Recruiters in India often ask for total experience, notice period, last CTC and expected CTC. If they have, add short lines above your sign-off, such as "Total experience: 13 years" and "Notice period: Immediate". Give your last drawn pay truthfully and a researched range for this role.`,
        `Before you share documents, check that the recruiter writes from an official company or agency email and that the job appears on the company’s careers page. A genuine employer or recruiter will not ask you to pay anything.`,
        `If you are replying in the same email thread, keep their subject line.`,
      ],
    },

    // ---------- Reach out ----------
    {
      id: 'linkedin-note',
      label: 'LinkedIn connection note',
      group: 'Reach out',
      kind: 'outreach',
      when: 'When you send a connection request to a recruiter or hiring manager about a specific role.',
      uses: ['contact', 'role', 'company'],
      limit: 200,
      body: '{{hi}} I saw the {{role}} role at {{company}}. I am a biomedical engineer with 13 years in ultrasound and would be glad to connect.',
      tips: [
        `On a free LinkedIn account a connection note can be up to 200 characters, and you can add notes to only a few requests a month. LinkedIn shows how many you have left.`,
        `For most people, send the request without a note and write once they accept. Free accounts can message anyone who has connected with you.`,
        `Save your notes for the people who matter most, such as hiring managers and former colleagues from Alliance, Mindray or BPL.`,
      ],
    },
    {
      id: 'recruiter-inmail',
      label: 'Message after connecting',
      group: 'Reach out',
      kind: 'outreach',
      when: 'When a recruiter or hiring manager has accepted your connection request and you want to introduce yourself for a role.',
      uses: ['contact', 'company', 'role', 'skill'],
      body: `{{hi}}

Thank you for connecting. I saw the {{role}} opening at {{company}} and wanted to introduce myself briefly.

{{pitch}} The role calls for {{skill}}, which has been a regular part of my work.

{{availabilityLine}}

Would you be open to a short call this week or next? I am happy to share my CV here.

Thank you,
{{me}}`,
      tips: [
        `Pick one requirement you clearly meet, in the advert’s own words.`,
        `Send it within a day or two of them accepting, while your name is fresh.`,
        `If there is no reply after about five working days, one short follow-up is enough.`,
      ],
    },
    {
      id: 'referral',
      label: 'Referral request',
      group: 'Reach out',
      kind: 'outreach',
      when: 'When a former colleague now works at the company and you are already back in touch. If it has been a long time, send a catch-up note first.',
      uses: ['contact', 'company', 'role'],
      subject: 'Referral request: {{role}}, Job ID [Job ID]',
      body: `{{hi}}

I hope you are keeping well. I have seen the {{role}} opening at {{company}} (Job ID: [Job ID]), and since you know the company from the inside, I wanted to ask your advice.

Would you be comfortable referring me for it? Any guidance on the team or the hiring process would also help a great deal. The job link is [job link], and I have attached my CV.

To save you time, here is a short note you could paste into the referral form.

{{me}} is a biomedical engineer with 13 years in diagnostic ultrasound, from installing and servicing Philips systems to clinical training at Mindray and product specialist work at BPL Medical Technologies. She brings {{strengths}}. She is available to join immediately.

Please feel free to say no if the timing is not right. Thank you either way.

Warm regards,
{{me}}`,
      tips: [
        `Make it easy for them. With the exact title, Job ID, link and CV in one message, the referral takes them very little time.`,
        `Ask people with a few years in the relevant team, rather than senior leaders who receive many requests.`,
        `If there is no reply, one gentle nudge after about five working days is enough. Thank them whatever the outcome.`,
      ],
    },
    {
      id: 'warm-update',
      label: 'Catch-up note',
      group: 'Reach out',
      kind: 'outreach',
      when: 'When you want to reconnect with a former colleague or manager and let them know you are available, with nothing asked of them.',
      uses: ['contact'],
      body: `{{hi}}

It has been a while, and I hope you are keeping well. I was thinking of our time working together at [where you worked together] and wanted to say hello.

A quick update from my side. I am looking for my next role in [the kind of work you want, e.g. clinical applications or product support], ideally a long-term one with an established company. {{availabilityLine}}

How are things with you? I would be glad to hear what you are working on these days.

Warm regards,
{{me}}`,
      tips: [
        `Reconnect first and ask later. A referral request lands better once you have been back in touch.`,
        `Good people to start with are former colleagues from Alliance, Mindray, Focus and BPL, and clinicians you trained who now know people at device companies.`,
        `If they reply warmly and work somewhere that fits, the Referral request is the natural next step.`,
      ],
    },
    {
      id: 'info-chat',
      label: 'Ask for a 15-minute chat',
      group: 'Reach out',
      kind: 'outreach',
      when: 'When you want to learn about a role you are considering, such as complaint handling or customer success, from someone who does it now.',
      uses: ['contact', 'mutual', 'role', 'company'],
      body: `{{hi}}

We are both connected to {{mutual}}, and I came across your work as {{role}} at {{company}}. I am a biomedical engineer with 13 years in ultrasound, and I am exploring a move into this kind of work.

Would you have 15 minutes for a call in the next week or two? I would like to understand what the work involves day to day and which skills matter most. I will keep to time and fit around your schedule.

Thank you,
{{me}}`,
      tips: [
        `No shared connection? Replace the first line with how you found them, such as a post they wrote or a group you are both in.`,
        `On LinkedIn, connect first, with or without a short note, and send this once they accept. A free account can message anyone you are connected with.`,
        `Keep the call about learning. Prepare three questions, and ask about openings only if the conversation leads there.`,
        `Send a short thank-you the same day and mention one thing you learned.`,
      ],
    },

    // ---------- Follow up ----------
    {
      id: 'followup',
      label: 'Follow-up after applying',
      group: 'Follow up',
      kind: 'followup',
      when: 'About a week after you apply, if you have not heard back.',
      uses: ['contact', 'company', 'role'],
      logAs: 'followup',
      subject: 'Following up: {{role}} application',
      body: `{{greeting}}

I recently applied for the {{role}} position at {{company}} and wanted to check whether my application is still under consideration.

{{pitch}} The role matches my experience closely, and I would be glad to talk. {{availabilityLine}}

I have attached my CV again for convenience. Please let me know if you need anything else from me.

Kind regards,
{{signature}}`,
      tips: [
        `Wait five to seven working days after applying. A message within a day or two can feel rushed.`,
        `Send it to the person you applied to, or to a recruiter at the company, and keep it short.`,
        `Saving it to the tracker sets your next reminder for a week from today.`,
      ],
    },
    {
      id: 'followup-2',
      label: 'Second follow-up',
      group: 'Follow up',
      kind: 'followup',
      when: 'Optional, for a role that still matters to you. Send it a week or two after your first follow-up, as a last gentle check before you let the application rest.',
      uses: ['contact', 'company', 'role'],
      logAs: 'followup',
      subject: 'Checking in: {{role}} application',
      body: `{{greeting}}

I am writing once more about my application for the {{role}} position at {{company}}. If it is still open, I remain interested and would be glad to talk. {{availabilityLine}}

If the role has been filled or plans have changed, a short note would help me plan, and I would be glad to be considered for similar roles in future.

Thank you for your time.

Kind regards,
{{signature}}`,
      tips: [
        `This is the last nudge for this application. If another week passes without a reply, mark it closed in your tracker and give your energy to newer leads. Silence is common and says nothing about you.`,
        `Keep it shorter than the first follow-up and stay warm. A friendly tone leaves the door open for future roles.`,
      ],
    },

    // ---------- After interviews ----------
    {
      id: 'thanks',
      label: 'Thank-you after an interview',
      group: 'After interviews',
      kind: 'thanks',
      when: 'Within 24 hours of an interview, to the person who interviewed you.',
      uses: ['contact', 'company', 'role', 'interviewDate', 'topic'],
      logAs: 'interview',
      subject: 'Thank you: {{role}} interview on {{interviewDate}}',
      body: `{{greeting}}

Thank you for meeting me on {{interviewDate}} to discuss the {{role}} role at {{company}}. I enjoyed our conversation about {{topic}}. It gave me a clearer picture of what you need and confirmed my interest in the role.

I would bring your team {{strengths}}. I can also share references or anything else you need.

Thank you again for your time. I look forward to hearing about the next steps.

Kind regards,
{{signature}}`,
      tips: [
        `Send it by email within 24 hours. If several people interviewed you, send each a short note with a different detail.`,
        `Mention one real point from the conversation. It shows you listened and makes the note feel personal.`,
        `Note the date they gave for a decision. If it passes without news, the status check is ready for you.`,
      ],
    },
    {
      id: 'status-check',
      label: 'Status check after an interview',
      group: 'After interviews',
      kind: 'followup',
      when: 'When the date they gave for a decision has passed and you have not heard back.',
      uses: ['contact', 'company', 'role', 'interviewDate'],
      logAs: 'followup',
      subject: 'Following up: {{role}} interview',
      body: `{{greeting}}

I hope you are well. I am following up on my interview on {{interviewDate}} for the {{role}} role at {{company}}. I enjoyed our conversation and remain very interested in the position.

Could you let me know if there is any update on the next steps or the timeline? I am happy to provide anything else you need, such as references or documents.

Thank you for your time.

Kind regards,
{{signature}}`,
      tips: [
        `One status check per stage is enough. If a week passes with no reply, let this one rest and put your energy elsewhere.`,
        `The recruiter who arranged the interview often knows the timeline best, so they are a good person to ask.`,
      ],
    },
    {
      id: 'decline',
      label: 'Withdraw or decline',
      group: 'After interviews',
      kind: 'other',
      when: 'When you have accepted another offer and want to step out of this process or decline their offer, while leaving the door open.',
      uses: ['contact', 'company', 'role', 'newRole'],
      logAs: 'closed',
      subject: 'Update on the {{role}} role | {{me}}',
      body: `{{greeting}}

Thank you for the time you and the team have given me during the process for the {{role}} role at {{company}}. I have accepted a position as {{newRole}} with another organisation, so I will not be taking this opportunity further.

This was a difficult decision. I appreciated our conversations and everything I learned about your team. I hope our paths cross again, and I would be glad to stay in touch.

With best wishes,
{{signature}}`,
      tips: [
        `Send it once you have signed the new offer, so they can move on with other candidates. If joining depends on background verification, you may prefer to wait until that is complete.`,
        `If they had already made you an offer, add a line thanking them for it. There is no need to name the other company or the salary.`,
        `A warm exit is remembered, and the same company may be right for you later.`,
      ],
    },
  ],
};
