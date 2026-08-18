import { supabaseAdmin } from '../services/supabase/supabaseClient.js';
import { createFeedback, analyzeFeedback } from '../services/feedbackService.js';
import { CreateFeedbackInput } from '../schemas/feedbackSchemas.js';

const sampleFeedbacks: CreateFeedbackInput[] = [
  {
    title: 'Dashboard loading latency on date range filter change',
    customerName: 'Sarah Connor',
    customerEmail: 'sarah.connor@cyberdyne.io',
    feedbackDate: '2026-08-15',
    source: 'Customer Support',
    category: 'Performance',
    status: 'Open',
    content: 'When switching date range filters on the main intelligence dashboard, queries take over 5 seconds to load. We need faster response times for daily executive reporting.',
    inputType: 'text',
  },
  {
    title: 'Support for Okta SAML 2.0 Single Sign-On',
    customerName: 'Marcus Vance',
    customerEmail: 'm.vance@enterprise-sec.com',
    feedbackDate: '2026-08-16',
    source: 'Sales Team',
    category: 'Feature Request',
    status: 'In Progress',
    content: 'Our security compliance team requires SAML 2.0 SSO via Okta or Azure AD before we can upgrade to the Enterprise tier for 500 team members.',
    inputType: 'text',
  },
  {
    title: 'Invoice PDF download returns HTTP 500 error',
    customerName: 'Elena Rostova',
    customerEmail: 'elena@fintechglobal.co',
    feedbackDate: '2026-08-16',
    source: 'Direct Feedback',
    category: 'Billing',
    status: 'Open',
    content: 'Clicking the Download PDF Invoice button under Billing Settings throws a 500 error when monthly usage exceeds $5,000. Our accounting department needs invoices for tax filing.',
    inputType: 'text',
  },
  {
    title: 'Action tracker navigation menu hard to find',
    customerName: 'David Kim',
    customerEmail: 'dkim@designhub.app',
    feedbackDate: '2026-08-17',
    source: 'Direct Feedback',
    category: 'Usability',
    status: 'Resolved',
    content: 'New team members struggled to locate the action item tracker because it was nested under settings. Moving it to the main navigation rail would improve daily workflow clarity.',
    inputType: 'text',
  },
  {
    title: 'Automated Slack alerts for critical feedback',
    customerName: 'Jessica Alba',
    customerEmail: 'jessica@techscale.io',
    feedbackDate: '2026-08-17',
    source: 'Survey',
    category: 'Feature Request',
    status: 'Open',
    content: 'We would love real-time Slack channel notifications whenever a customer submits negative feedback classified as High or Critical priority.',
    inputType: 'text',
  },
  {
    title: 'Feedback table text overlaps on mobile screens',
    customerName: 'Robert Chen',
    customerEmail: 'robert.chen@mobilefirst.org',
    feedbackDate: '2026-08-17',
    source: 'Product Review',
    category: 'Bug',
    status: 'Open',
    content: 'When viewing the feedback list on iPhone 15 Safari, customer email addresses overlap with the category tags in portrait orientation.',
    inputType: 'text',
  },
  {
    title: 'Kudos to support team for rapid resolution',
    customerName: 'Amanda Lewis',
    customerEmail: 'amanda@growthmetrics.net',
    feedbackDate: '2026-08-18',
    source: 'Customer Support',
    category: 'Customer Service',
    status: 'Resolved',
    content: 'The technical support team resolved our webhook payload issue within 30 minutes of submitting the ticket. Outstanding customer service experience!',
    inputType: 'text',
  },
  {
    title: 'CSV export times out on large datasets',
    customerName: 'Vikram Patel',
    customerEmail: 'vikram@datapulse.in',
    feedbackDate: '2026-08-18',
    source: 'Internal Team',
    category: 'Performance',
    status: 'In Progress',
    content: 'Attempting to export 8,000 feedback records to CSV fails with gateway timeout. Suggest implementing background async CSV generation with email download link.',
    inputType: 'text',
  },
  {
    title: 'Dark mode status badges text contrast',
    customerName: 'Chloe Bennett',
    customerEmail: 'chloe@creativeminds.uk',
    feedbackDate: '2026-08-18',
    source: 'Direct Feedback',
    category: 'Usability',
    status: 'Open',
    content: 'In dark mode, the In Progress amber status badge text can be slightly difficult to read against dark surfaces. Increasing text brightness would enhance accessibility.',
    inputType: 'text',
  },
  {
    title: 'Ability to create custom tags for product modules',
    customerName: 'Liam O\'Connor',
    customerEmail: 'liam@cloudnext.io',
    feedbackDate: '2026-08-18',
    source: 'Direct Feedback',
    category: 'Product Experience',
    status: 'Open',
    content: 'We have 12 distinct microservices and need custom tags on feedback items to route them automatically to the correct squad lead.',
    inputType: 'text',
  },
];

async function seed() {
  console.log('🌱 Seeding 10 realistic customer feedback records...');

  // Get user ID for charag@zignuts.com
  const { data: usersData, error: userErr } = await supabaseAdmin.auth.admin.listUsers();
  if (userErr || !usersData?.users?.length) {
    console.error('Failed to list auth users:', userErr);
    return;
  }

  const user = usersData.users.find((u) => u.email === 'charag@zignuts.com') || usersData.users[0];
  console.log(`Using target user ID: ${user.id} (${user.email})`);

  let count = 0;
  for (const item of sampleFeedbacks) {
    try {
      const fb = await createFeedback(user.id, item);
      console.log(`[${++count}/10] Created Feedback: "${fb.title}" (ID: ${fb.id})`);
      
      // Automatically trigger AI Analysis for each record
      console.log(`    ↳ Running AI Analysis on feedback ID ${fb.id}...`);
      await analyzeFeedback(user.id, fb.id);
      console.log(`    ✅ AI Analysis completed! Category: ${fb.category}`);
    } catch (err) {
      console.error(`❌ Failed seeding item "${item.title}":`, err);
    }
  }

  console.log('🎉 Successfully created and analyzed 10 feedback records!');
}

seed();
