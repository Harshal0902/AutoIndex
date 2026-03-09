"use client";

import { Button } from '@/components/ui/button';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { Bot, Zap, Shield, Globe, RefreshCw, Brain, Activity } from 'lucide-react';

const features = [
  { icon: Brain, title: 'AI Risk Profiling', desc: 'Infers your risk tolerance from on-chain behavior - no questionnaires.' },
  { icon: Globe, title: 'Cross-Chain Native', desc: 'Your index spans multiple chains. LI.FI handles all bridging & routing.' },
  { icon: RefreshCw, title: 'Autonomous Rebalancing', desc: 'Agent monitors drift and rebalances automatically. Zero intervention.' },
  { icon: Shield, title: 'Fully Transparent', desc: 'Every decision logged and explained. You see exactly why the agent acts.' },
  { icon: Zap, title: 'LI.FI Powered', desc: 'Execution via LI.FI MCP Server for optimal cross-chain transactions.' },
  { icon: Activity, title: 'Index Fund Strategy', desc: 'Disciplined, diversified, risk-aware - the proven approach, on-chain.' },
];

const steps = [
  { num: '01', title: 'Connect Wallet', desc: 'Link your wallet. No funds moved.' },
  { num: '02', title: 'AI Analysis', desc: 'Agent analyzes your portfolio and infers risk profile.' },
  { num: '03', title: 'Review Index', desc: 'See your personalized index fund and approve.' },
  { num: '04', title: 'Auto-Pilot', desc: 'Agent manages rebalancing autonomously via LI.FI.' },
];


export default function Page() {
  return (
    <div>
      <section className='relative overflow-hidden'>
        <div className='absolute inset-0 bg-[radial-gradient(ellipse_at_top,hsl(175_80%_50%/0.08),transparent_50%)]' />
        <div className='container relative py-24'>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7 }}
            className='max-w-3xl mx-auto text-center'
          >
            <div className='inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm text-primary mb-6'>
              <Bot className='h-4 w-4' />
              Autonomous AI Portfolio Manager
            </div>
            <h1 className='text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight leading-[1.1] mb-6'>
              Your Personal
              <br />
              <span className='text-gradient'>Index Fund Agent</span>
            </h1>
            <p className='text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10'>
              AutoIndex analyzes your on-chain portfolio, constructs a personalized index fund,
              and rebalances it autonomously across chains using LI.FI.
            </p>
            <div className='flex flex-col sm:flex-row gap-4 justify-center'>
              <Link href='/dashboard'>
                <Button variant='hero' size='xl'>
                  Launch Dashboard
                </Button>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.8, delay: 0.3 }}
            className='mt-16 max-w-2xl mx-auto'
          >
            <div className='card-glass p-6 glow-border'>
              <div className='flex items-center gap-3 mb-4'>
                <div className='h-3 w-3 rounded-full bg-success animate-pulse' />
                <span className='text-sm font-mono text-muted-foreground'>autoindex-agent-v1 • running</span>
              </div>
              <div className='space-y-2 font-mono text-sm'>
                <div className='text-muted-foreground'>
                  <span className='text-primary'>→</span> Observing portfolio across 6 chains...
                </div>
                <div className='text-muted-foreground'>
                  <span className='text-primary'>→</span> ETH allocation drifted +3.2% above target
                </div>
                <div className='text-muted-foreground'>
                  <span className='text-primary'>→</span> Planning rebalance: ETH → MATIC via LI.FI
                </div>
                <div className='text-success'>
                  <span className='text-primary'>✓</span> Rebalance executed. Portfolio aligned.
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <section className='container py-24'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className='text-center mb-16'
        >
          <h2 className='text-3xl md:text-4xl font-bold mb-4'>
            Why <span className='text-gradient'>AutoIndex</span>?
          </h2>
          <p className='text-muted-foreground max-w-xl mx-auto'>
            Index funds outperform most active strategies. AutoIndex brings this discipline on-chain.
          </p>
        </motion.div>

        <div className='grid md:grid-cols-2 lg:grid-cols-3 gap-4'>
          {features.map((f, i) => (
            <motion.div
              key={f.title}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className='card-glass p-6 hover:border-primary/30 transition-colors group'
            >
              <div className='flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 border border-primary/20 mb-4 group-hover:bg-primary/20 transition-colors'>
                <f.icon className='h-5 w-5 text-primary' />
              </div>
              <h3 className='font-semibold mb-2'>{f.title}</h3>
              <p className='text-sm text-muted-foreground'>{f.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      <section className='container py-24'>
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className='text-center mb-16'
        >
          <h2 className='text-3xl md:text-4xl font-bold mb-4'>How It Works</h2>
          <p className='text-muted-foreground'>Four steps to autonomous portfolio management.</p>
        </motion.div>

        <div className='grid md:grid-cols-4 gap-6 max-w-4xl mx-auto'>
          {steps.map((s, i) => (
            <motion.div
              key={s.num}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.15 }}
              className='text-center border-2 rounded-xl p-4'
            >
              <div className='text-4xl font-bold text-primary/20 mb-3 font-mono'>{s.num}</div>
              <h3 className='font-semibold mb-2'>{s.title}</h3>
              <p className='text-sm text-muted-foreground'>{s.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </div>
  )
}
