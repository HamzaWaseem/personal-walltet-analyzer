import React, { useState, useEffect, useRef } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { Chart } from 'chart.js/auto';

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
      const response = await axios.get('http://127.0.0.1:8000/api/financial-data/', {
        headers: { Authorization: `Bearer ${token}` }
      });
      const travelExpenses = response.data.categories
        .filter(cat => cat.category === 'Travel')
        .map(cat => ({
          id: cat.id,
          description: cat.description,
          amount: cat.total_amount,
          date: cat.date
        }));
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

  // Prepare data for charts
  const chartData = expenses.reduce((acc, expense) => {
    // Format the date to get month and year
    const date = new Date(expense.date);
    const monthYear = date.toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
    
    if (!acc[monthYear]) {
      acc[monthYear] = 0;
    }
    acc[monthYear] += parseFloat(expense.amount);
    return acc;
  }, {});

  // Sort the data by date
  const sortedLabels = Object.keys(chartData).sort((a, b) => {
    const dateA = new Date(a);
    const dateB = new Date(b);
    return dateA - dateB;
  });

  const chartLabels = sortedLabels;
  const chartValues = sortedLabels.map(label => chartData[label]);

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

      {/* Charts Section */}
      <section className="charts-section">
        <div className="charts-container">
          <div className="chart-wrapper bar-chart">
            <BarChart labels={chartLabels} data={chartValues} />
          </div>
          <div className="chart-wrapper pie-chart">
            <PieChart labels={chartLabels} data={chartValues} />
          </div>
        </div>
      </section>

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

// Bar Chart Component
function BarChart({ labels, data }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current || !labels || !data) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [
          {
            label: 'Travel Expenses by Month',
            data: data,
            backgroundColor: [
              '#FF6384',
              '#36A2EB',
              '#FFCE56',
              '#4BC0C0',
              '#9966FF',
              '#FF9F40',
            ],
            borderColor: '#222',
            borderWidth: 1,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        scales: {
          y: {
            beginAtZero: true,
            ticks: {
              color: '#fff',
              callback: function(value) {
                return '$' + value;
              }
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
            },
          },
          x: {
            ticks: {
              color: '#fff',
            },
            grid: {
              color: 'rgba(255, 255, 255, 0.1)',
            },
          },
        },
        plugins: {
          legend: {
            display: true,
            position: 'top',
            labels: {
              color: '#fff',
              font: { size: 14 },
            },
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return '$' + context.formattedValue;
              }
            }
          }
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [labels, data]);

  return <canvas ref={chartRef} style={{ width: '100%', height: '300px' }} />;
}

// Pie Chart Component
function PieChart({ labels, data }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!chartRef.current || !labels || !data) return;

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    const ctx = chartRef.current.getContext('2d');
    if (!ctx) return;

    chartInstance.current = new Chart(ctx, {
      type: 'pie',
      data: {
        labels: labels,
        datasets: [
          {
            data: data,
            backgroundColor: [
              '#FF6384',
              '#36A2EB',
              '#FFCE56',
              '#4BC0C0',
              '#9966FF',
              '#FF9F40',
            ],
            borderColor: '#222',
            borderWidth: 2,
          },
        ],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            position: 'top',
            labels: {
              color: '#fff',
              font: { size: 14 },
            },
          },
          tooltip: {
            callbacks: {
              label: function(context) {
                return context.label + ': $' + context.formattedValue;
              }
            }
          }
        },
      },
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [labels, data]);

  return <canvas ref={chartRef} style={{ width: '100%', height: '300px' }} />;
}