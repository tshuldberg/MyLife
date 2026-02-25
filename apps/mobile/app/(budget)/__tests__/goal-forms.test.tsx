import { act, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { Alert } from 'react-native';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import BudgetCreateGoalScreen from '../goal/create';
import BudgetGoalScreen from '../goal/[id]';

let routeParams: { id?: string | string[] } = { id: 'goal-vacation' };

const replaceMock = vi.fn();
const backMock = vi.fn();
const createGoalMock = vi.fn();
const listEnvelopesMock = vi.fn();
const getGoalByIdMock = vi.fn();
const updateGoalMock = vi.fn();
const deleteGoalMock = vi.fn();
const mockDb = { id: 'mock-db' };

vi.mock('expo-router', () => ({
  useRouter: () => ({
    replace: replaceMock,
    back: backMock,
  }),
  useLocalSearchParams: () => routeParams,
}));

vi.mock('../../../components/DatabaseProvider', () => ({
  useDatabase: () => mockDb,
}));

vi.mock('@mylife/budget', () => ({
  createGoal: (...args: unknown[]) => createGoalMock(...args),
  listEnvelopes: (...args: unknown[]) => listEnvelopesMock(...args),
  getGoalById: (...args: unknown[]) => getGoalByIdMock(...args),
  updateGoal: (...args: unknown[]) => updateGoalMock(...args),
  deleteGoal: (...args: unknown[]) => deleteGoalMock(...args),
}));

describe('Budget goal forms (mobile)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    routeParams = { id: 'goal-vacation' };

    listEnvelopesMock.mockReturnValue([
      {
        id: 'env-travel',
        name: 'Travel',
      },
    ]);

    getGoalByIdMock.mockReturnValue({
      id: 'goal-vacation',
      envelope_id: 'env-travel',
      name: 'Vacation Plan',
      target_amount: 120000,
      completed_amount: 30000,
      target_date: '2026-08-31',
      is_completed: 0,
      created_at: '2026-02-25T00:00:00.000Z',
      updated_at: '2026-02-25T00:00:00.000Z',
    });
  });

  it('creates a goal from user input and routes back to goals list', async () => {
    render(<BudgetCreateGoalScreen />);

    await waitFor(() => {
      expect(screen.getByText('GOAL DETAILS')).toBeInTheDocument();
    });

    fireEvent.change(screen.getByPlaceholderText('Emergency Fund'), {
      target: { value: 'Laptop Upgrade' },
    });

    const amountInputs = screen.getAllByPlaceholderText('0.00');
    fireEvent.change(amountInputs[0], { target: { value: '1200.00' } });
    fireEvent.change(amountInputs[1], { target: { value: '250.00' } });
    fireEvent.change(screen.getByPlaceholderText('2026-12-31'), {
      target: { value: '2026-11-01' },
    });

    fireEvent.click(screen.getByRole('button', { name: 'Create Goal' }));

    await waitFor(() => {
      expect(createGoalMock).toHaveBeenCalledWith(
        { id: 'mock-db' },
        expect.any(String),
        expect.objectContaining({
          envelope_id: 'env-travel',
          name: 'Laptop Upgrade',
          target_amount: 120000,
          completed_amount: 25000,
          target_date: '2026-11-01',
          is_completed: 0,
        }),
      );
      expect(replaceMock).toHaveBeenCalledWith(
        expect.stringMatching(/\/\(budget\)\/goals\?refresh=/),
      );
    });
  });

  it('prevents create submission when no envelopes are available', async () => {
    listEnvelopesMock.mockReturnValue([]);

    render(<BudgetCreateGoalScreen />);

    await waitFor(() => {
      expect(
        screen.getByText('Create at least one envelope before adding a goal.'),
      ).toBeInTheDocument();
    });

    expect(screen.getByRole('button', { name: 'Create Goal' })).toBeDisabled();
  });

  it('saves goal edits and routes back to goals list', async () => {
    render(<BudgetGoalScreen />);

    await waitFor(() => {
      expect(screen.getByDisplayValue('Vacation Plan')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Save' }));

    await waitFor(() => {
      expect(updateGoalMock).toHaveBeenCalledWith(
        { id: 'mock-db' },
        'goal-vacation',
        expect.objectContaining({
          name: 'Vacation Plan',
          target_amount: 120000,
          completed_amount: 30000,
          is_completed: 0,
        }),
      );
      expect(replaceMock).toHaveBeenCalledWith(
        expect.stringMatching(/\/\(budget\)\/goals\?refresh=/),
      );
    });
  });

  it('toggles completion and deletes goal through confirmation action', async () => {
    render(<BudgetGoalScreen />);

    await waitFor(() => {
      expect(screen.getByRole('button', { name: 'Mark Complete' })).toBeInTheDocument();
    });

    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: 'Mark Complete' }));
    });

    await waitFor(() => {
      expect(updateGoalMock).toHaveBeenCalledWith(
        { id: 'mock-db' },
        'goal-vacation',
        expect.objectContaining({
          is_completed: 1,
          completed_amount: 120000,
        }),
      );
    });

    fireEvent.click(screen.getByRole('button', { name: 'Delete Goal' }));

    const alertCalls = (Alert.alert as unknown as { mock: { calls: unknown[][] } }).mock.calls;
    expect(alertCalls.length).toBeGreaterThan(0);

    const deleteButtons = alertCalls[0][2] as Array<{ text: string; onPress?: () => void }>;
    const deleteAction = deleteButtons.find((entry) => entry.text === 'Delete');
    await act(async () => {
      deleteAction?.onPress?.();
    });

    await waitFor(() => {
      expect(deleteGoalMock).toHaveBeenCalledWith({ id: 'mock-db' }, 'goal-vacation');
      expect(replaceMock).toHaveBeenCalledWith(
        expect.stringMatching(/\/\(budget\)\/goals\?refresh=/),
      );
    });
  });
});
