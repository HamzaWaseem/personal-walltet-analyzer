import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { AlertTriangle, Edit2, Trash2, Plus } from 'lucide-react';

export default function BudgetPage() {
  const [budgets, setBudgets] = useState([]);
  const [editingBudget, setEditingBudget] = useState(null);
  const [newBudget, setNewBudget] = useState({ category: '', limit_amount: '' });
  const token = localStorage.getItem('token');

  const fetchBudgets = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/budgets/', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setBudgets(response.data);
    } catch (error) {
      console.error('Error fetching budgets:', error);
    }
  };

  useEffect(() => {
    fetchBudgets();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        'http://127.0.0.1:8000/api/budgets/',
        newBudget,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setNewBudget({ category: '', limit_amount: '' });
      fetchBudgets();
    } catch (error) {
      console.error('Error creating budget:', error);
    }
  };

  const handleUpdate = async (budgetId) => {
    try {
      await axios.put(
        `http://127.0.0.1:8000/api/budgets/${budgetId}/`,
        editingBudget,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setEditingBudget(null);
      fetchBudgets();
    } catch (error) {
      console.error('Error updating budget:', error);
    }
  };

  const handleDelete = async (budgetId) => {
    try {
      await axios.delete(
        `http://127.0.0.1:8000/api/budgets/${budgetId}/`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      fetchBudgets();
    } catch (error) {
      console.error('Error deleting budget:', error);
    }
  };

  return (
    <div className="budget-page">
      <h1>Budget Management</h1>
      
      {/* Add New Budget Form */}
      <div className="card">
        <h2>Add New Budget</h2>
        <form onSubmit={handleSubmit} className="budget-form">
          <select
            value={newBudget.category}
            onChange={(e) => setNewBudget({ ...newBudget, category: e.target.value })}
            required
          >
            <option value="">Select Category</option>
            <option value="Food">Food</option>
            <option value="Entertainment">Entertainment</option>
            <option value="Bills">Bills</option>
            <option value="Travel">Travel</option>
            <option value="Shopping">Shopping</option>
          </select>
          <input
            type="number"
            value={newBudget.limit_amount}
            onChange={(e) => setNewBudget({ ...newBudget, limit_amount: e.target.value })}
            placeholder="Monthly Limit"
            required
          />
          <button type="submit" className="btn-primary">
            <Plus className="icon" /> Add Budget
          </button>
        </form>
      </div>

      {/* Budget List */}
      <div className="budget-list">
        {budgets.map((budget) => (
          <div key={budget.id} className="budget-card">
            {editingBudget?.id === budget.id ? (
              <div className="edit-form">
                <input
                  type="number"
                  value={editingBudget.limit_amount}
                  onChange={(e) => setEditingBudget({
                    ...editingBudget,
                    limit_amount: e.target.value
                  })}
                />
                <button onClick={() => handleUpdate(budget.id)}>Save</button>
                <button onClick={() => setEditingBudget(null)}>Cancel</button>
              </div>
            ) : (
              <>
                <div className="budget-header">
                  <h3>{budget.category}</h3>
                  <div className="budget-actions">
                    <button onClick={() => setEditingBudget(budget)}>
                      <Edit2 className="icon" />
                    </button>
                    <button onClick={() => handleDelete(budget.id)}>
                      <Trash2 className="icon" />
                    </button>
                  </div>
                </div>
                <div className="budget-details">
                  <div className="budget-progress">
                    <div 
                      className="progress-bar"
                      style={{ 
                        width: `${Math.min(budget.percentage_used, 100)}%`,
                        backgroundColor: budget.percentage_used > 90 ? 'red' : '#4CAF50'
                      }}
                    />
                  </div>
                  <div className="budget-numbers">
                    <span>Spent: ${budget.spent}</span>
                    <span>Limit: ${budget.limit_amount}</span>
                  </div>
                  {budget.percentage_used > 90 && (
                    <div className="budget-alert">
                      <AlertTriangle className="icon" />
                      <span>Near budget limit!</span>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        ))}
      </div>
    </div>
  );
} 