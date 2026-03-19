import { ModuleWebFallback } from '@/components/module-web-fallback';

const TITLE_MAP: Record<string, string> = {
  budget: 'Budget Overview',
  transactions: 'Transactions',
  'transactions/import': 'Import Transactions',
  subscriptions: 'Subscriptions',
  'subscriptions/add': 'Add Subscription',
  'subscriptions/calendar': 'Subscription Calendar',
  accounts: 'Connected Accounts',
  'accounts/connect': 'Connect Account',
  reports: 'Budget Reports',
  'reports/spending': 'Spending Report',
  'reports/income-vs-expense': 'Income vs Expense',
  'reports/net-worth': 'Net Worth',
  settings: 'Budget Settings',
  'settings/alerts': 'Budget Alerts',
  'settings/currencies': 'Currencies',
  goals: 'Goals',
  'debt-payoff': 'Debt Payoff',
  upcoming: 'Upcoming Bills',
};

function resolveTitle(slug: string[]): string {
  const key = slug.join('/');
  return TITLE_MAP[key] ?? `MyBudget: ${key}`;
}

export default function BudgetCatchAllPage({
  params,
}: {
  params: { slug: string[] };
}) {
  const slug = params.slug;
  const routePath = `/budget/${slug.join('/')}`;

  return (
    <ModuleWebFallback
      moduleName="MyBudget"
      title={resolveTitle(slug)}
      routePath={routePath}
      summary="Envelope budgeting made simple. Track spending, manage subscriptions, and stay on top of your finances."
      accentColor="#22C55E"
      primaryHref="/"
      primaryLabel="Open MyLife Hub"
      links={[
        { href: '/budget/transactions', label: 'Transactions' },
        { href: '/budget/reports', label: 'Reports' },
        { href: '/budget/subscriptions', label: 'Subscriptions' },
      ]}
    />
  );
}
