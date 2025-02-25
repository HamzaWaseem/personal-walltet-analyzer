import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LoginForm from './components/LoginForm';
import SignupForm from './components/SignupForm';
import HomePage from './components/HomePage';
import AddTransactionForm from './components/AddTransactionForm';
import TransactionList from './components/TransactionList';
import FinancialAnalytics from './components/FinancialAnalytics';
import SettingsPage from './components/SettingsPage';
import BudgetPage from './components/BudgetPage';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import "./styles.css";
import TravelExpenses from './components/TravelExpenses';

const App = () => {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<LoginForm />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/signup" element={<SignupForm />} />

        {/* Protected routes wrapped in Layout */}
        <Route 
          path="/home" 
          element={
            <ProtectedRoute>
              <Layout>
                <HomePage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route 
          path="/add-transaction" 
          element={
            <ProtectedRoute>
              <Layout>
                <AddTransactionForm />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route 
          path="/transactions" 
          element={
            <ProtectedRoute>
              <Layout>
                <TransactionList />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route 
          path="/financial-analytics" 
          element={
            <ProtectedRoute>
              <Layout>
                <FinancialAnalytics />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route 
          path="/settings" 
          element={
            <ProtectedRoute>
              <Layout>
                <SettingsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route 
          path="/travel-expenses" 
          element={
            <ProtectedRoute>
              <Layout>
                <TravelExpenses />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route 
          path="/budgets" 
          element={
            <ProtectedRoute>
              <Layout>
                <BudgetPage />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
};

export default App;
