import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function BudgetPage() {
  const [budgets, setBudgets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newBudget, setNewBudget] = useState({
    category: 'Food',
    limit_amount: ''
  });
  const token = localStorage.getItem('token');

  const categories = [
    'Food',
    'Entertainment',
    'Bills',
    'Travel',
    'Shopping'
  ];

  useEffect(() => {
    fetchBudgets();
  }, []);

  const fetchBudgets = () => {
    axios
      .get('http://127.0.0.1:8000/api/budgets/', {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(response => {
        setBudgets(response.data);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error fetching budgets:', err);
        setError('Failed to load budgets. Please try again later.');
        setLoading(false);
      });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!newBudget.limit_amount || parseFloat(newBudget.limit_amount) <= 0) {
      setError('Please enter a valid budget amount greater than zero.');
      return;
    }

    // Check if a budget for this category already exists
    const existingBudget = budgets.find(b => b.category === newBudget.category);

    if (existingBudget) {
      // Update existing budget
      handleUpdate(existingBudget.id, newBudget.limit_amount);
    } else {
      // Create new budget
      axios
        .post('http://127.0.0.1:8000/api/budgets/', newBudget, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(() => {
          fetchBudgets();
          setNewBudget({ ...newBudget, limit_amount: '' });
          setError(null);
        })
        .catch(err => {
          console.error('Error creating budget:', err);
          setError('Failed to create budget. Please try again.');
        });
    }
  };

  const handleUpdate = (budgetId, updatedAmount) => {
    if (parseFloat(updatedAmount) <= 0) {
      setError('Budget amount must be greater than zero.');
      return;
    }

    axios
      .put(`http://127.0.0.1:8000/api/budgets/${budgetId}/`, {
        limit_amount: updatedAmount,
        category: budgets.find(b => b.id === budgetId).category
      }, {
        headers: { Authorization: `Bearer ${token}` }
      })
      .then(() => {
        fetchBudgets();
        setError(null);
      })
      .catch(err => {
        console.error('Error updating budget:', err);
        setError('Failed to update budget. Please try again.');
      });
  };

  const handleDelete = (budgetId) => {
    if (window.confirm('Are you sure you want to delete this budget limit?')) {
      axios
        .delete(`http://127.0.0.1:8000/api/budgets/${budgetId}/`, {
          headers: { Authorization: `Bearer ${token}` }
        })
        .then(() => {
          fetchBudgets();
          setError(null);
        })
        .catch(err => {
          console.error('Error deleting budget:', err);
          setError('Failed to delete budget. Please try again.');
        });
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="budget-page-container">
      <div className="budget-page-wrapper">
        <header className="budget-page-header">
          <Link to="/home" className="back-button">
            <ArrowLeft className="icon" />
            Back to Dashboard
          </Link>
          <h1>Budget Management</h1>
        </header>

        {error && <div className="error-message">{error}</div>}

        <div className="budget-form-section">
          <h2>Set New Budget Limit</h2>
          <form onSubmit={handleSubmit} className="budget-form">
            <div className="form-group">
              <label htmlFor="category">Category</label>
              <select
                id="category"
                value={newBudget.category}
                onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
              >
                {categories.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label htmlFor="limit_amount">Monthly Limit ($)</label>
              <input
                type="number"
                id="limit_amount"
                value={newBudget.limit_amount}
                onChange={(e) => setNewBudget({ ...newBudget, limit_amount: e.target.value })}
                placeholder="Enter monthly limit"
                step="0.01"
                min="0"
                required
              />
            </div>
            <button type="submit" className="bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded-lg transition duration-200 ease-in-out w-full">
              Set Budget Limit
            </button>
          </form>
        </div>

        <div className="current-budgets-section">
          <h2>Current Budget Limits</h2>
          <div className="budgets-list">
            {budgets.length === 0 ? (
              <p>No budget limits set yet.</p>
            ) : (
              budgets.map(budget => (
                <div key={budget.id} className="budget-item">
                  <div className="budget-info">
                    <span className="category">{budget.category}</span>
                    <span className="amount">${budget.limit_amount}</span>
                  </div>
                  <div className="budget-actions">
                    <button
                      onClick={() => {
                        const newAmount = prompt('Enter new budget limit:', budget.limit_amount);
                        if (newAmount !== null) {
                          handleUpdate(budget.id, newAmount);
                        }
                      }}
                      className="bg-green-500 hover:bg-green-600 text-white font-semibold py-1 px-3 rounded-lg mr-2 transition duration-200 ease-in-out"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(budget.id)}
                      className="bg-red-500 hover:bg-red-600 text-white font-semibold py-1 px-3 rounded-lg transition duration-200 ease-in-out"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}