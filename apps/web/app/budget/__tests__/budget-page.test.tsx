import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import BudgetPage from '../page';
import {
  doCreateAccount,
  doCreateEnvelope,
  doCreateGoal,
  doCreateTransaction,
  doDeleteGoal,
  doUpdateGoal,
  fetchAccounts,
  fetchEnvelopes,
  fetchGoals,
  fetchTransactions,
} from '../actions';

vi.mock('../actions', () => ({
  fetchEnvelopes: vi.fn(),
  fetchAccounts: vi.fn(),
  fetchTransactions: vi.fn(),
  fetchGoals: vi.fn(),
  doCreateEnvelope: vi.fn().mockResolvedValue(undefined),
  doUpdateEnvelope: vi.fn().mockResolvedValue(undefined),
  doArchiveEnvelope: vi.fn().mockResolvedValue(undefined),
  doRestoreEnvelope: vi.fn().mockResolvedValue(undefined),
  doDeleteEnvelope: vi.fn().mockResolvedValue(undefined),
  doCreateAccount: vi.fn().mockResolvedValue(undefined),
  doUpdateAccount: vi.fn().mockResolvedValue(undefined),
  doArchiveAccount: vi.fn().mockResolvedValue(undefined),
  doRestoreAccount: vi.fn().mockResolvedValue(undefined),
  doDeleteAccount: vi.fn().mockResolvedValue(undefined),
  doCreateTransaction: vi.fn().mockResolvedValue(undefined),
  doUpdateTransaction: vi.fn().mockResolvedValue(undefined),
  doDeleteTransaction: vi.fn().mockResolvedValue(undefined),
  doCreateGoal: vi.fn().mockResolvedValue(undefined),
  doUpdateGoal: vi.fn().mockResolvedValue(undefined),
  doDeleteGoal: vi.fn().mockResolvedValue(undefined),
}));

const ENVELOPES = [
  {
    id: 'env-groceries',
    name: 'Groceries',
    icon: '🛒',
    color: null,
    monthly_budget: 45000,
    rollover_enabled: 1,
    archived: 0,
    sort_order: 0,
    created_at: '2026-02-25T00:00:00.000Z',
    updated_at: '2026-02-25T00:00:00.000Z',
  },
  {
    id: 'env-archive',
    name: 'Archived Envelope',
    icon: '🧊',
    color: null,
    monthly_budget: 1000,
    rollover_enabled: 0,
    archived: 1,
    sort_order: 1,
    created_at: '2026-02-25T00:00:00.000Z',
    updated_at: '2026-02-25T00:00:00.000Z',
  },
];

const ACCOUNTS = [
  {
    id: 'acct-checking',
    name: 'Checking',
    type: 'checking' as const,
    current_balance: 120000,
    currency: 'USD',
    archived: 0,
    sort_order: 0,
    created_at: '2026-02-25T00:00:00.000Z',
    updated_at: '2026-02-25T00:00:00.000Z',
  },
  {
    id: 'acct-archive',
    name: 'Old Account',
    type: 'cash' as const,
    current_balance: 500,
    currency: 'USD',
    archived: 1,
    sort_order: 1,
    created_at: '2026-02-25T00:00:00.000Z',
    updated_at: '2026-02-25T00:00:00.000Z',
  },
];

const TRANSACTIONS = [
  {
    id: 'tx-grocery',
    envelope_id: 'env-groceries',
    account_id: 'acct-checking',
    amount: 4200,
    direction: 'outflow' as const,
    merchant: 'Groceries run',
    note: 'Weekly shopping',
    occurred_on: '2026-02-20',
    created_at: '2026-02-20T00:00:00.000Z',
    updated_at: '2026-02-20T00:00:00.000Z',
  },
  {
    id: 'tx-paycheck',
    envelope_id: null,
    account_id: 'acct-checking',
    amount: 250000,
    direction: 'inflow' as const,
    merchant: 'Salary',
    note: null,
    occurred_on: '2026-02-21',
    created_at: '2026-02-21T00:00:00.000Z',
    updated_at: '2026-02-21T00:00:00.000Z',
  },
];

const GOALS = [
  {
    id: 'goal-vacation',
    envelope_id: 'env-groceries',
    name: 'Vacation Fund',
    target_amount: 300000,
    target_date: '2026-12-31',
    completed_amount: 120000,
    is_completed: 0,
    created_at: '2026-02-26T00:00:00.000Z',
    updated_at: '2026-02-26T00:00:00.000Z',
  },
  {
    id: 'goal-complete',
    envelope_id: 'env-archive',
    name: 'Emergency Buffer',
    target_amount: 50000,
    target_date: null,
    completed_amount: 50000,
    is_completed: 1,
    created_at: '2026-02-25T00:00:00.000Z',
    updated_at: '2026-02-25T00:00:00.000Z',
  },
];

function cardByKicker(kicker: string): HTMLElement {
  const node = screen.getByText(kicker);
  const card = node.closest('section');
  if (!card) {
    throw new Error(`Could not locate section for ${kicker}`);
  }
  return card as HTMLElement;
}

async function renderPage() {
  render(<BudgetPage />);
  await waitFor(() => {
    expect(fetchEnvelopes).toHaveBeenCalledTimes(1);
    expect(fetchAccounts).toHaveBeenCalledTimes(1);
    expect(fetchTransactions).toHaveBeenCalledTimes(1);
    expect(fetchGoals).toHaveBeenCalledTimes(1);
  });
}

describe('BudgetPage behavior', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(fetchEnvelopes).mockResolvedValue(ENVELOPES);
    vi.mocked(fetchAccounts).mockResolvedValue(ACCOUNTS);
    vi.mocked(fetchTransactions).mockResolvedValue(TRANSACTIONS);
    vi.mocked(fetchGoals).mockResolvedValue(GOALS);
    vi.spyOn(window, 'confirm').mockReturnValue(true);
  });

  it('loads dashboard data and toggles archived filters from toolbar buttons', async () => {
    const user = userEvent.setup();

    await renderPage();

    expect(screen.getByRole('heading', { name: 'Budget' })).toBeInTheDocument();
    expect(cardByKicker('Envelopes')).toHaveTextContent('Groceries');
    expect(cardByKicker('Accounts')).toHaveTextContent('Checking');

    await user.click(
      screen.getByRole('button', { name: 'Show Archived Envelopes' }),
    );
    await waitFor(() => {
      expect(fetchEnvelopes).toHaveBeenLastCalledWith(true);
    });

    await user.click(
      screen.getByRole('button', { name: 'Show Archived Accounts' }),
    );
    await waitFor(() => {
      expect(fetchAccounts).toHaveBeenLastCalledWith(true);
    });

    await user.click(screen.getByRole('button', { name: 'Refresh' }));
    await waitFor(() => {
      expect(fetchEnvelopes).toHaveBeenLastCalledWith(true);
      expect(fetchAccounts).toHaveBeenLastCalledWith(true);
    });
  });

  it(
    'submits create flows for envelope/account/transaction/goal from user input',
    async () => {
      const user = userEvent.setup();
      vi.spyOn(globalThis.crypto, 'randomUUID')
        .mockReturnValueOnce('env-new')
        .mockReturnValueOnce('acct-new')
        .mockReturnValueOnce('tx-new')
        .mockReturnValueOnce('goal-new');

      await renderPage();

      const envelopeCard = cardByKicker('New Envelope');
      fireEvent.change(within(envelopeCard).getByPlaceholderText('Envelope name'), {
        target: { value: 'Travel' },
      });
      fireEvent.change(within(envelopeCard).getByPlaceholderText('0.00'), {
        target: { value: '123.45' },
      });
      fireEvent.change(within(envelopeCard).getByPlaceholderText('Icon (optional)'), {
        target: { value: '✈️' },
      });
      await user.click(within(envelopeCard).getByRole('button', { name: 'Create' }));

      await waitFor(() => {
        expect(doCreateEnvelope).toHaveBeenCalledWith(
          'env-new',
          expect.objectContaining({
            name: 'Travel',
            monthly_budget: 12345,
            icon: '✈️',
          }),
        );
      });

      const accountCard = cardByKicker('New Account');
      fireEvent.change(within(accountCard).getByPlaceholderText('Account name'), {
        target: { value: 'Rainy Day' },
      });
      fireEvent.change(within(accountCard).getByPlaceholderText('0.00'), {
        target: { value: '50.25' },
      });
      await user.click(within(accountCard).getByRole('button', { name: 'Create' }));

      await waitFor(() => {
        expect(doCreateAccount).toHaveBeenCalledWith(
          'acct-new',
          expect.objectContaining({
            name: 'Rainy Day',
            current_balance: 5025,
            currency: 'USD',
          }),
        );
      });

      const txCard = cardByKicker('New Transaction');
      fireEvent.change(within(txCard).getByPlaceholderText('0.00'), {
        target: { value: '42.35' },
      });
      await user.selectOptions(within(txCard).getAllByRole('combobox')[0], 'outflow');
      fireEvent.change(
        txCard.querySelector('input[type="date"]') as HTMLInputElement,
        {
          target: { value: '2026-02-25' },
        },
      );
      fireEvent.change(within(txCard).getByPlaceholderText('Merchant (optional)'), {
        target: { value: 'Corner Store' },
      });
      await user.selectOptions(within(txCard).getAllByRole('combobox')[1], 'acct-checking');
      await user.selectOptions(within(txCard).getAllByRole('combobox')[2], 'env-groceries');
      fireEvent.change(within(txCard).getByPlaceholderText('Note (optional)'), {
        target: { value: 'Snacks' },
      });
      await user.click(within(txCard).getByRole('button', { name: 'Create' }));

      await waitFor(() => {
        expect(doCreateTransaction).toHaveBeenCalledWith(
          'tx-new',
          expect.objectContaining({
            amount: 4235,
            direction: 'outflow',
            occurred_on: '2026-02-25',
            merchant: 'Corner Store',
            account_id: 'acct-checking',
            envelope_id: 'env-groceries',
            note: 'Snacks',
          }),
        );
      });

      const goalCard = cardByKicker('New Goal');
      fireEvent.change(within(goalCard).getByPlaceholderText('Goal name'), {
        target: { value: 'Laptop Upgrade' },
      });
      await user.selectOptions(within(goalCard).getByRole('combobox'), 'env-groceries');
      fireEvent.change(within(goalCard).getByPlaceholderText('Target amount (0.00)'), {
        target: { value: '1200.00' },
      });
      fireEvent.change(within(goalCard).getByPlaceholderText('Completed amount (0.00)'), {
        target: { value: '200.00' },
      });
      fireEvent.change(
        goalCard.querySelector('input[type="date"]') as HTMLInputElement,
        {
          target: { value: '2026-11-01' },
        },
      );
      await user.click(within(goalCard).getByRole('button', { name: 'Create' }));

      await waitFor(() => {
        expect(doCreateGoal).toHaveBeenCalledWith(
          'goal-new',
          expect.objectContaining({
            envelope_id: 'env-groceries',
            name: 'Laptop Upgrade',
            target_amount: 120000,
            completed_amount: 20000,
            target_date: '2026-11-01',
            is_completed: 0,
          }),
        );
      });
    },
    12000,
  );

  it('filters visible transactions and triggers goal row actions from list buttons', async () => {
    const user = userEvent.setup();

    await renderPage();

    const txSection = screen.getByText('All Directions').closest('section') as HTMLElement;
    expect(within(txSection).getByText('Groceries run')).toBeInTheDocument();
    expect(within(txSection).getByText('Salary')).toBeInTheDocument();

    await user.selectOptions(within(txSection).getAllByRole('combobox')[0], 'inflow');

    await waitFor(() => {
      expect(within(txSection).queryByText('Groceries run')).not.toBeInTheDocument();
      expect(within(txSection).getByText('Salary')).toBeInTheDocument();
    });

    const goalsSection = cardByKicker('Goals');
    await user.click(within(goalsSection).getByRole('button', { name: 'Complete' }));

    await waitFor(() => {
      expect(doUpdateGoal).toHaveBeenCalledWith(
        'goal-vacation',
        expect.objectContaining({
          is_completed: 1,
        }),
      );
    });

    await user.click(within(goalsSection).getAllByRole('button', { name: 'Delete' })[0]);

    await waitFor(() => {
      expect(doDeleteGoal).toHaveBeenCalledWith('goal-vacation');
    });
  });

  it('filters and sorts goals by status, envelope, and sort selection', async () => {
    const user = userEvent.setup();

    await renderPage();

    const goalsSection = cardByKicker('Goals');
    const goalFilters = within(goalsSection).getAllByRole('combobox');

    expect(within(goalsSection).getByText('Vacation Fund')).toBeInTheDocument();
    expect(within(goalsSection).getByText('Emergency Buffer')).toBeInTheDocument();

    await user.selectOptions(goalFilters[0], 'completed');
    await waitFor(() => {
      expect(within(goalsSection).queryByText('Vacation Fund')).not.toBeInTheDocument();
      expect(within(goalsSection).getByText('Emergency Buffer')).toBeInTheDocument();
    });

    await user.selectOptions(goalFilters[0], 'all');
    await user.selectOptions(goalFilters[1], 'env-groceries');
    await waitFor(() => {
      expect(within(goalsSection).getByText('Vacation Fund')).toBeInTheDocument();
      expect(within(goalsSection).queryByText('Emergency Buffer')).not.toBeInTheDocument();
    });

    await user.selectOptions(goalFilters[1], 'all');
    await user.selectOptions(goalFilters[2], 'target_desc');

    await waitFor(() => {
      const visibleTitles = within(goalsSection)
        .getAllByText(/Vacation Fund|Emergency Buffer/)
        .map((node) => node.textContent);
      expect(visibleTitles[0]).toBe('Vacation Fund');
      expect(visibleTitles[1]).toBe('Emergency Buffer');
    });
  });
});
