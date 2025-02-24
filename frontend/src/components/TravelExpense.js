import React, { useState } from 'react';
import axios from 'axios';
import { ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';

export default function TravelExpense() {
  const navigate = useNavigate();
  const token = localStorage.getItem('token');
  const [formData, setFormData] = useState({
    description: '',
    amount: '',
    category: 'Travel',
    date: new Date().toISOString().split('T')[0]
  });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate fields
    if (!formData.description || !formData.amount || !formData.date) {
      setError('All fields are required.');
      return;
    }
    if (parseFloat(formData.amount) <= 0 || isNaN(parseFloat(formData.amount))) {
      setError('Amount must be a valid number greater than zero.');
      return;
    }

    try {
      const response = await axios.post(
        'http://127.0.0.1:8000/api/transactions/',
        formData,
        {
          headers: { Authorization: `Bearer ${token}` }
        }
      );
      if (response.status === 201) {
        alert('Travel expense added successfully!');
        // Reset form
        setFormData({
          description: '',
          amount: '',
          category: 'Travel',
          date: new Date().toISOString().split('T')[0]
        });
        setError('');
        navigate('/transactions');
      }
    } catch (error) {
      console.error('Error adding travel expense:', error);
      setError('Failed to add travel expense. Please try again.');
    }
  };

  return (
    <div className="add-data-container">
      <div className="add-data-wrapper">
        <header className="add-data-header">
          <Link to="/home" className="back-button">
            <ArrowLeft className="icon" />
            Back to Dashboard
          </Link>
          <h1>Add Travel Expense</h1>
        </header>
        {error && <p className="error-message">{error}</p>}
        <form className="add-data-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <input
              type="text"
              id="description"
              name="description"
              placeholder="Enter expense description"
              value={formData.description}
              onChange={handleChange}
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="amount">Amount</label>
            <input
              type="number"
              id="amount"
              name="amount"
              placeholder="Enter amount"
              value={formData.amount}
              onChange={handleChange}
              required
              min="0"
              step="0.01"
            />
          </div>

          <div className="form-group">
            <label htmlFor="date">Date</label>
            <input
              type="date"
              id="date"
              name="date"
              value={formData.date}
              onChange={handleChange}
              required
            />
          </div>

          <button type="submit" className="submit-button">
            Add Travel Expense
          </button>
        </form>
      </div>
    </div>
  );
}