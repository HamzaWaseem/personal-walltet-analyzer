import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';

export default function TravelExpenses() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [expenses, setExpenses] = useState([]);
  const [newExpense, setNewExpense] = useState({
    description: '',
    amount: '',
    category: 'Travel',
    expense_type: 'travel',
    date: new Date().toISOString().split('T')[0]
  });

  useEffect(() => {
    fetchTravelExpenses();
  }, []);

  const fetchTravelExpenses = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/api/transactions/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const travelExpenses = response.data.filter(exp => exp.expense_type === 'travel');
      setExpenses(travelExpenses);
    } catch (error) {
      console.error('Error fetching travel expenses:', error);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post(
        'http://127.0.0.1:8000/api/transactions/',
        newExpense,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      setNewExpense({
        description: '',
        amount: '',
        category: 'Travel',
        expense_type: 'travel',
        date: new Date().toISOString().split('T')[0]
      });
      fetchTravelExpenses();
    } catch (error) {
      console.error('Error adding travel expense:', error);
    }
  };

  const handleChange = (e) => {
    setNewExpense({
      ...newExpense,
      [e.target.name]: e.target.value
    });
  };

  return (
    <div className="travel-expenses-container">
      <h1>Travel Expenses</h1>
      
      {/* Add New Travel Expense Form */}
      <div className="expense-form-card">
        <h2>Add New Travel Expense</h2>
        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Description:</label>
            <input
              type="text"
              name="description"
              value={newExpense.description}
              onChange={handleChange}
              required
            />
          </div>
          
          <div className="form-group">
            <label>Amount ($):</label>
            <input
              type="number"
              name="amount"
              value={newExpense.amount}
              onChange={handleChange}
              step="0.01"
              min="0"
              required
            />
          </div>
          
          <div className="form-group">
            <label>Date:</label>
            <input
              type="date"
              name="date"
              value={newExpense.date}
              onChange={handleChange}
              required
            />
          </div>
          
          <button type="submit" className="submit-button">
            Add Expense
          </button>
        </form>
      </div>

      {/* Display Travel Expenses */}
      <div className="expenses-list-card">
        <h2>Your Travel Expenses</h2>
        <div className="expenses-list">
          {expenses.map((expense) => (
            <div key={expense.id} className="expense-item">
              <div className="expense-details">
                <h3>{expense.description}</h3>
                <p>Amount: ${expense.amount}</p>
                <p>Date: {new Date(expense.date).toLocaleDateString()}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
} 