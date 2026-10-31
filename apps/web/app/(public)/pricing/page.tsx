import { Metadata } from 'next';
import Link from 'next/link';
import {
  Check,
  Crown,
  Star,
  Zap,
  ShieldCheck,
  ArrowRight,
  HelpCircle,
  Sparkles,
  Lock,
} from 'lucide-react';

export const metadata: Metadata = {
  title: 'Pricing & Plans | BarterWave Marketplace',
  description:
    'Simple, transparent pricing for BarterWave promoted listings, spotlight features, and verified trader memberships.',
};

export default function PricingPage() {
  const plans = [
    {
      id: 'free',
      name: 'Free Member',
      badge: 'STANDARD',
      price: '₦0',
      period: 'forever free',
      description: 'Everything you need to list items, discover trades, and negotiate swaps peer-to-peer.',
      highlight: false,
      features: [
        'Post up to 10 active listings',
        'Direct P2P item swapping & negotiation',
        'Secure 6-digit in-person exchange PIN',
        'Standard search ranking',
        'Community safety & reporting tools',
      ],
      ctaText: 'Get Started Free',
      ctaHref: '/register',
      ctaStyle: 'bg-slate-100 hover:bg-slate-200 text-slate-900 border border-slate-200',
    },
    {
      id: 'spotlight',
      name: 'Listing Spotlight',
      badge: 'POPULAR PROMOTION',
      price: '₦500 — ₦1,200',
      period: 'one-time ad boost',
      description: 'Pin your item to the very top of category feeds for maximum visibility and rapid offers.',
      highlight: true,
      features: [
        '3-Day Boost (₦500) or 7-Day Boost (₦1,200)',
        'Pinned at the top of category & search feeds',
        'Distinctive golden spotlight badge',
        'Up to 3x higher buyer inquiries and deals',
        'Instant push broadcast to matching wanted lists',
      ],
      ctaText: 'Boost a Listing',
      ctaHref: '/post',
      ctaStyle: 'bg-emerald-600 hover:bg-emerald-700 text-white shadow-md shadow-emerald-600/20',
    },
    {
      id: 'pro',
      name: 'Pro Trader',
      badge: 'POWER SELLERS',
      price: '₦5,000',
      period: 'per month',
      description: 'Designed for high-volume merchants, collectors, and verified power barterers.',
      highlight: false,
      features: [
        'Unlimited active marketplace listings',
        'Verified Pro Trader trust badge on profile',
        '2 Free Listing Spotlights included each month',
        'Advanced analytics: view count & offer insights',
        'Priority 24/7 customer & dispute resolution support',
      ],
      ctaText: 'Upgrade to Pro',
      ctaHref: '/register',
      ctaStyle: 'bg-slate-900 hover:bg-black text-white shadow-md shadow-slate-900/20',
    },
  ];

  const faqs = [
    {
      q: 'Does BarterWave hold or escrow money for item trades?',
      a: 'No. BarterWave is a pure peer-to-peer (P2P) bartering and marketplace platform. Users meet in person in daylight or at public meetup spots, inspect items physically, and exchange items directly. BarterWave never holds buyer funds in escrow or acts as a payment intermediary. All transactions on our payment gateway are strictly for platform digital services (such as ad spotlighting and Pro subscriptions).',
    },
    {
      q: 'What payment methods are supported for digital services?',
      a: 'Through our secure payment gateway (Paystack), we accept all major Nigerian debit cards (Mastercard, Visa, Verve), direct bank transfers, and USSD payments in Nigerian Naira (NGN).',
    },
    {
      q: 'Can I cancel my Pro Trader subscription at any time?',
      a: 'Yes. You can manage or cancel your subscription at any time directly from your Account Settings. You will retain all Pro benefits until the end of your current billing period.',
    },
    {
      q: 'How does Listing Spotlight work?',
      a: 'Spotlight is an on-demand ad boost. When you apply Spotlight to an item from your dashboard or during posting, your listing is pinned to the top of its category and marked with a prominent golden badge for 3 or 7 days.',
    },
    {
      q: 'What is the refund policy for platform digital services?',
      a: 'If a technical issue prevents a paid Spotlight from appearing or your subscription from activating, contact our support team at support@barterwave.com within 48 hours for immediate resolution or refund.',
    },
  ];

  return (
    <div className="min-h-screen bg-slate-50 text-[#0F172A] py-12 px-4 sm:px-6 lg:px-8 font-sans">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-xs font-bold uppercase tracking-wider mb-4">
            <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
            <span>Transparent Pricing</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-[#0F172A] tracking-tight">
            Simple, Transparent Plans for Every Trader
          </h1>
          <p className="mt-3 text-base text-slate-600 leading-relaxed">
            Trade peer-to-peer for free, or accelerate your deals with targeted listing promotions and professional seller tools.
          </p>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`bg-white rounded-2xl border p-6 sm:p-7 flex flex-col justify-between transition-all duration-200 ${
                plan.highlight
                  ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-lg relative'
                  : 'border-slate-200/90 shadow-sm hover:border-slate-300 hover:shadow-md'
              }`}
            >
              {plan.highlight && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-emerald-600 text-white text-[10px] font-black uppercase tracking-wider px-3 py-1 rounded-full shadow-sm">
                  Most Popular
                </div>
              )}

              <div>
                <div className="flex items-center justify-between gap-2 mb-3">
                  <span
                    className={`px-2 py-0.5 rounded text-[9px] font-black uppercase tracking-wider ${
                      plan.highlight
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-slate-100 text-slate-600 border border-slate-200'
                    }`}
                  >
                    {plan.badge}
                  </span>
                </div>

                <h2 className="text-xl font-bold text-[#0F172A] mb-1">{plan.name}</h2>
                <p className="text-xs text-slate-500 leading-relaxed mb-5 min-h-[36px]">{plan.description}</p>

                <div className="mb-6 pb-6 border-b border-slate-100">
                  <div className="text-2xl sm:text-3xl font-extrabold text-[#0F172A] tracking-tight">
                    {plan.price}
                  </div>
                  <span className="text-xs text-slate-400 font-medium">{plan.period}</span>
                </div>

                {/* Features List */}
                <div className="space-y-3 mb-8">
                  <div className="text-[11px] font-bold uppercase tracking-wider text-slate-400">
                    What&apos;s Included:
                  </div>
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5 text-xs text-slate-700">
                      <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5 stroke-[2.5]" />
                      <span className="font-medium leading-snug">{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <Link
                href={plan.ctaHref}
                className={`w-full py-3 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all active:scale-[0.98] ${plan.ctaStyle}`}
              >
                <span>{plan.ctaText}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>
          ))}
        </div>

        {/* Regulatory & Operating Disclosure Banner */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 mb-16 shadow-sm">
          <div className="flex flex-col sm:flex-row items-start gap-4">
            <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200/60 flex items-center justify-center shrink-0 text-blue-600">
              <ShieldCheck className="w-6 h-6 stroke-[2]" />
            </div>
            <div>
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="px-2 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 rounded text-[10px] font-black uppercase tracking-wider">
                  NIGERIAN MARKETPLACE
                </span>
                <span className="px-2 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded text-[10px] font-black uppercase tracking-wider">
                  ZERO ESCROW CUSTODY
                </span>
              </div>
              <h3 className="text-base font-bold text-[#0F172A] mb-1">
                Direct Peer-to-Peer Model &amp; Payment Compliance
              </h3>
              <p className="text-xs sm:text-sm text-slate-600 leading-relaxed font-normal">
                BarterWave operates as an online marketplace technology platform connecting buyers, sellers, and barterers across Nigeria. <strong>BarterWave does not hold buyer or seller funds in escrow, custody, or deposit accounts.</strong> Peer-to-peer exchanges and physical handovers occur directly between users in person, verified via our secure 6-digit confirmation protocol. All card, bank, and USSD payments processed via Paystack are solely for digital platform services, advertising boosts, and subscription memberships rendered directly by BarterWave.
              </p>
            </div>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="bg-white border border-slate-200/90 rounded-2xl p-6 sm:p-8 shadow-sm">
          <div className="flex items-center gap-2 mb-6">
            <HelpCircle className="w-5 h-5 text-emerald-600" />
            <h2 className="text-xl font-bold text-[#0F172A]">Frequently Asked Questions</h2>
          </div>

          <div className="divide-y divide-slate-100">
            {faqs.map((faq, i) => (
              <div key={i} className="py-4 first:pt-0 last:pb-0">
                <h4 className="text-sm font-bold text-[#0F172A] mb-1.5">{faq.q}</h4>
                <p className="text-xs text-slate-600 leading-relaxed font-normal">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Footer Support Prompt */}
        <div className="mt-12 text-center text-xs text-slate-500">
          Have questions about our pricing or business model? Reach our team at{' '}
          <a href="mailto:support@barterwave.com" className="text-emerald-700 font-bold hover:underline">
            support@barterwave.com
          </a>
        </div>
      </div>
    </div>
  );
}
