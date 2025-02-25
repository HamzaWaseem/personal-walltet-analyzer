from django.shortcuts import render, redirect
from rest_framework import viewsets, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from rest_framework.views import APIView
from django.contrib.auth.models import User
from django.db.models import Sum
from django.http import HttpResponse
from collections import defaultdict
import numpy as np
import matplotlib.pyplot as plt
import io
import csv
import json
import pandas as pd
import logging
from reportlab.lib.pagesizes import letter
from reportlab.pdfgen import canvas
from datetime import datetime
from .models import Transaction, Budget
from .serializers import TransactionSerializer, BudgetSerializer
from .utils import PieChartGenerator  # Import the utility class

# Set up logger
logger = logging.getLogger(__name__)

# Define a simple homepage view
def home(request):
    return HttpResponse("Welcome to the Finance Management API!")
# views.py
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from .serializers import UserSettingsSerializer

class UserSettingsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserSettingsSerializer(request.user, context={'request': request})
        return Response(serializer.data)

    def put(self, request):
        serializer = UserSettingsSerializer(
            request.user,
            data=request.data,
            partial=True,
            context={'request': request}
        )
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def export_financial_data(request, format_type):
    user = request.user
    transactions = Transaction.objects.filter(user=user)
    months = transactions.values('date__month', 'date__year').annotate(amount=Sum('amount'))

    # Prepare financial summary
    total_spending = transactions.aggregate(Sum('amount'))['amount__sum'] or 0
    average_spending = transactions.aggregate(avg_spending=Sum('amount') / transactions.count())['avg_spending'] or 0
    categories = transactions.values('category').annotate(total_amount=Sum('amount'))
    #total transitions number
    total_transitions = transactions.count()


    # Prepare transaction data
    data = {
        "Username": user.username,
        "Total Spending": float(total_spending),
        "Average Spending": float(average_spending),
        "Total: transitions": float(total_transitions),
        "Spending by Category": [{cat["category"]: float(cat["total_amount"])} for cat in categories],
        "Transactions": [
            {
                "Description": t.description,
                "Category": t.category,
                "Date": t.date.strftime("%Y-%m-%d"),
                "Price": float(t.amount)
            }
            for t in transactions
        ],
        "Transactions by Month": [
            {
                "Month": f"{month['date__year']}-{month['date__month']:02d}",
                "Price": float(month['amount'])
            }
            for month in months
        ],
    }

    # Handle CSV export
    if format_type == "csv":
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = f'attachment; filename=financial_data_{user.username}.csv'
        writer = csv.writer(response)
        writer.writerow(["Username", user.username])
        writer.writerow(["Total Spending", total_spending])
        writer.writerow(["Average Spending", average_spending])
        writer.writerow([])
        writer.writerow(["Category", "Total Amount"])
        for cat in categories:
            writer.writerow([cat["category"], float(cat["total_amount"])]);
        writer.writerow([])
        writer.writerow(["Description", "Category", "Date", "Price",])
        for t in transactions:
            writer.writerow([t.description, t.category, t.date.strftime("%Y-%m-%d"), float(t.amount)])
        return response

    # Handle JSON export
    elif format_type == "json":
        response = HttpResponse(json.dumps(data, indent=4), content_type='application/json')
        response['Content-Disposition'] = f'attachment; filename=financial_data_{user.username}.json'
        return response

    # Handle PDF export
    elif format_type == "pdf":
        response = HttpResponse(content_type='application/pdf')
        response['Content-Disposition'] = f'attachment; filename=financial_data_{user.username}.pdf'
        p = canvas.Canvas(response, pagesize=letter)
        
        # Title and Summary
        p.drawString(100, 750, f"Financial Report for {user.username}")
        p.drawString(100, 730, f"Total Spending: ${total_spending}")
        p.drawString(100, 710, f"Average Spending: ${average_spending}")
        p.drawString(100, 690, f"Total transitions: {total_transitions}")
        
        # Categories Section
        p.drawString(100, 650, "Spending by Category:")
        y = 630
        for cat in categories:
            p.drawString(120, y, f"- {cat['category']}: ${float(cat['total_amount'])}")
            y -= 20
        
        # Transactions Section
        p.drawString(100, y - 20, "Transactions:")
        y -= 40
        for t in transactions:
            p.drawString(120, y, f"{t.date.strftime('%Y-%m-%d')} - {t.category} - {t.description} - ${float(t.amount)}")
            y -= 20
            if y < 50:  # Add a new page if we're running out of space
                p.showPage()
                y = 750
        
        # Monthly Summary Section
        p.drawString(100, y - 20, "Monthly Summary:")
        y -= 40
        for month in months:
            month_str = f"{month['date__year']}-{month['date__month']:02d}"
            p.drawString(120, y, f"{month_str} - ${float(month['amount'])}")
            y -= 20
            if y < 50:  # Add a new page if we're running out of space
                p.showPage()
                y = 750
        
        p.save()
        return response

    return HttpResponse({"error": "Invalid format"}, status=400)

class FinancialDataView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        user_transactions = Transaction.objects.filter(user=request.user)
        amounts = np.array([float(transaction.amount) for transaction in user_transactions])
        total_spending = np.sum(amounts) if len(amounts) > 0 else 0
        average_spending = np.mean(amounts) if len(amounts) > 0 else 0
        #total transitions number
        total_transitions = user_transactions.count()
        #get sepnding by month
        month = user_transactions.values('date__month').annotate(total_amount=Sum('amount'))


        categories = user_transactions.values('category').annotate(total_amount=Sum('amount'))

        data = {
            'total_spending': total_spending,
            'average_spending': average_spending,
            'total_transitions': total_transitions,
            'spending_by_month': [
                {'month': cat['date__month'], 'total_amount': cat['total_amount']} for cat in month
            ],
            'categories': [
                {'category': cat['category'], 'total_amount': cat['total_amount']} for cat in categories
            ],
        }
        return Response(data)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def category_spending_pie_chart(request):
    transactions = Transaction.objects.filter(user=request.user)
    category_data = (
        transactions.values('category')
        .annotate(total_amount=Sum('amount'))
        .order_by('category')
    )

    if not category_data:
        return Response({"message": "No data available to create the pie chart."}, status=status.HTTP_204_NO_CONTENT)

    categories = [entry['category'] for entry in category_data]
    amounts = [entry['total_amount'] for entry in category_data]

    try:
        buffer = PieChartGenerator.create_pie_chart(categories, amounts, title="Your Spending by Category")
        return HttpResponse(buffer, content_type='image/png')
    except ValueError as e:
        return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
        logger.error(f"Error generating pie chart: {str(e)}")
        return Response({"error": f"An error occurred while generating the chart: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username')
        password = request.data.get('password')

        if not username or not password:
            return Response({"error": "Username and password are required."}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(username=username).exists():
            return Response({"error": "Username already exists."}, status=status.HTTP_400_BAD_REQUEST)

        User.objects.create_user(username=username, password=password)
        return Response({"message": "User created successfully!"}, status=status.HTTP_201_CREATED)

class TransactionViewSet(viewsets.ModelViewSet):
    serializer_class = TransactionSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Transaction.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
class TransactionView(APIView):
    permission_classes = [IsAuthenticated]
    
    def get(self, request):
        transactions = Transaction.objects.filter(user=request.user)
        serializer = TransactionSerializer(transactions, many=True)
        return Response(serializer.data)

    def post(self, request):
        transaction_data = request.data
        transaction_data['user'] = request.user.id
        serializer = TransactionSerializer(data=transaction_data, context={'request': request})

        if serializer.is_valid():
            # Check if there's a budget limit for this category
            category = transaction_data.get('category')
            amount = float(transaction_data.get('amount', 0))
            current_month = datetime.now().month
            current_year = datetime.now().year

            try:
                budget = Budget.objects.get(user=request.user, category=category)
                # Calculate total spending for this category in the current month
                monthly_spending = Transaction.objects.filter(
                    user=request.user,
                    category=category,
                    date__month=current_month,
                    date__year=current_year
                ).aggregate(total=Sum('amount'))['total'] or 0

                # Add the new transaction amount
                total_spending = float(monthly_spending) + amount

                # Check if this would exceed the budget
                if total_spending > float(budget.limit_amount):
                    # Create a serializable response without User objects
                    transaction_data = {
                        key: value for key, value in serializer.validated_data.items()
                        if key != 'user'
                    }
                    remaining_budget = float(budget.limit_amount) - float(monthly_spending)
                    exceeding_amount = amount - remaining_budget
                    return Response({
                        "error": f"Cannot add this transaction. Adding ${amount} would exceed your monthly budget limit of ${budget.limit_amount} for {category}.",
                        "details": {
                            "current_spending": float(monthly_spending),
                            "budget_limit": float(budget.limit_amount),
                            "remaining_budget": remaining_budget,
                            "exceeding_amount": exceeding_amount
                        },
                        "transaction": transaction_data
                    }, status=status.HTTP_400_BAD_REQUEST)

            except Budget.DoesNotExist:
                # No budget limit set for this category
                pass

            serializer.save()
            return Response({"message": "Transaction added successfully!", "transaction": serializer.data}, status=201)
        return Response(serializer.errors, status=400)

class BudgetViewSet(viewsets.ModelViewSet):
    serializer_class = BudgetSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Budget.objects.filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    def perform_update(self, serializer):
        serializer.save(user=self.request.user)
