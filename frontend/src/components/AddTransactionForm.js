import React, { useState, useEffect } from "react";
import { ArrowLeft } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";

const categories = [
  "Entertainment",
  "Food",
  "Shopping",
  "Bills",
  "Travel",
  "Others",
];

export default function AddData() {
  const [description, setDescription] = useState("");
  const [date, setDate] = useState("");
  const [category, setCategory] = useState(categories[0]);
  const [price, setPrice] = useState("");
  const [error, setError] = useState("");
  const [budgets, setBudgets] = useState({});
  const [currentSpending, setCurrentSpending] = useState({});
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  // Fetch budgets and current spending when component mounts
  useEffect(() => {
    const fetchBudgetData = async () => {
      try {
        const response = await axios.get("http://127.0.0.1:8000/api/budgets/", {
          headers: { Authorization: `Bearer ${token}` },
        });
        // Create a map of category to budget data
        const budgetMap = {};
        response.data.forEach(budget => {
          budgetMap[budget.category] = {
            limit: budget.limit_amount,
            spent: budget.spent
          };
        });
        setBudgets(budgetMap);
      } catch (error) {
        console.error("Error fetching budgets:", error);
      }
    };

    fetchBudgetData();
  }, [token]);

  const checkBudgetLimit = (category, amount) => {
    const budget = budgets[category];
    if (!budget) return true; // If no budget set, allow transaction

    const newTotal = budget.spent + parseFloat(amount);
    if (newTotal > budget.limit) {
      return {
        allowed: false,
        message: `This transaction would exceed your budget limit for ${category}.\nBudget: $${budget.limit}\nCurrently Spent: $${budget.spent}\nThis Transaction: $${amount}\nNew Total Would Be: $${newTotal}`
      };
    }
    return { allowed: true };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate fields
    if (!description || !date || !category || !price) {
      setError("All fields are required.");
      return;
    }
    if (parseFloat(price) <= 0 || isNaN(parseFloat(price))) {
      setError("Price must be a valid number greater than zero.");
      return;
    }

    // Check budget limit before submitting
    const budgetCheck = checkBudgetLimit(category, price);
    if (!budgetCheck.allowed) {
      setError(budgetCheck.message);
      return;
    }

    // Prepare the data for the transaction
    const transactionData = {
      description,
      amount: parseFloat(price),
      category,
      date,
    };

    try {
      await axios.post("http://127.0.0.1:8000/api/transactions/", transactionData, {
        headers: { Authorization: `Bearer ${token}` },
      });
      alert("Transaction added successfully!");
      // Reset the form fields
      setDescription("");
      setDate("");
      setCategory(categories[0]);
      setPrice("");
      setError("");
      navigate("/home");
    } catch (error) {
      console.error("Error response:", error.response);
      if (error.response?.status === 401) {
        alert("Session expired. Please log in again.");
        localStorage.clear();
        navigate("/login");
      } else {
        setError(
          error.response?.data?.detail ||
            "Failed to add transaction. Check console for details."
        );
      }
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
          <h1>Add Data</h1>
        </header>
        {error && (
          <p className="error-message" style={{ whiteSpace: 'pre-line' }}>
            {error}
          </p>
        )}
        <form className="add-data-form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="description">Description</label>
            <input
              type="text"
              id="description"
              placeholder="Enter a description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="date">Date</label>
            <input
              type="date"
              id="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              required
            />
          </div>
          <div className="form-group">
            <label htmlFor="category">Category</label>
            <select
              id="category"
              value={category}
              onChange={(e) => {
                setCategory(e.target.value);
                setError(""); // Clear any previous errors when category changes
              }}
            >
              {categories.map((cat) => (
                <option key={cat} value={cat}>
                  {cat}
                </option>
              ))}
            </select>
            {budgets[category] && (
              <small className="budget-info">
                Budget Limit: ${budgets[category].limit} | 
                Spent: ${budgets[category].spent}
              </small>
            )}
          </div>
          <div className="form-group">
            <label htmlFor="price">Price</label>
            <input
              type="number"
              id="price"
              step="0.01"
              placeholder="Enter price"
              value={price}
              onChange={(e) => {
                setPrice(e.target.value);
                setError(""); // Clear any previous errors when price changes
              }}
              required
            />
          </div>
          <button type="submit" className="submit-button">
            Add Data
          </button>
        </form>
      </div>
    </div>
  );
}
