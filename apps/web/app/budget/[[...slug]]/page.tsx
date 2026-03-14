import { ModuleWebFallback } from '@/components/module-web-fallback';

const TITLE_MAP: Record<string, string> = {
  '': 'MyBudget Web',
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

function resolveTitle(slug: string[] | undefined): string {
  const key = slug?.join('/') ?? '';
  return TITLE_MAP[key] ?? `MyBudget: ${key}`;
}

export default function BudgetCatchAllPage({
  params,
}: {
  params: { slug?: string[] };
}) {
  const slug = params.slug ?? [];
  const routePath = `/budget${slug.length > 0 ? `/${slug.join('/')}` : ''}`;

  return (
    <ModuleWebFallback
      moduleName="MyBudget"
      title={resolveTitle(slug)}
      routePath={routePath}
      summary="The archived MyBudget web app has been folded into MyLife. These web routes now stay online inside the hub while the full native budgeting workflow is rebuilt."
      accentColor="#0F8A5F"
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
