import { ModuleWebFallback } from '@/components/module-web-fallback';

export default function BudgetPage() {
  return (
    <ModuleWebFallback
      moduleName="MyBudget"
      title="Budget Overview"
      routePath="/budget"
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
