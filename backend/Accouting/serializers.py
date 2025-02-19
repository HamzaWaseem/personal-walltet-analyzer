from rest_framework import serializers
from .models import Transaction
from django.core.exceptions import ValidationError
from rest_framework import serializers
from django.contrib.auth.models import User
from .models import Profile

class UserSettingsSerializer(serializers.ModelSerializer):
    profile_picture = serializers.SerializerMethodField()
    password = serializers.CharField(write_only=True, required=False)
    monthly_income = serializers.DecimalField(max_digits=10, decimal_places=2, required=False)

    class Meta:
        model = User
        fields = ('username', 'password', 'profile_picture', 'monthly_income')

    def get_profile_picture(self, obj):
        try:
            pic = obj.profile.profile_picture
            if pic and hasattr(pic, "url"):
                request = self.context.get('request')
                # Build a full absolute URL
                return request.build_absolute_uri(pic.url)
            else:
                # Return None so that the frontend can show a default icon
                return None
        except Exception:
            return None

    def to_representation(self, instance):
        data = super().to_representation(instance)
        try:
            data['monthly_income'] = str(instance.profile.monthly_income) if instance.profile.monthly_income else None
        except Profile.DoesNotExist:
            data['monthly_income'] = None
        return data

    def update(self, instance, validated_data):
        instance.username = validated_data.get('username', instance.username)
        password = validated_data.get('password', None)
        if password:
            instance.set_password(password)
        instance.save()

        # Handle profile updates
        profile, created = Profile.objects.get_or_create(user=instance)
        
        # Update profile picture if provided
        profile_picture = self.initial_data.get('profile_picture')
        if profile_picture:
            profile.profile_picture = profile_picture

        # Update monthly income if provided
        monthly_income = validated_data.get('monthly_income')
        if monthly_income is not None:
            profile.monthly_income = monthly_income

        profile.save()
        return instance



class TransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = Transaction
        fields = ['id', 'description', 'amount', 'category', 'user', 'date']

    def validate(self, data):
        # Perform model-level validation (via the clean() method)
        transaction = Transaction(**data)
        try:
            transaction.clean()  # Calls the clean method of the model
        except ValidationError as e:
            raise serializers.ValidationError(e.message_dict)  # Raise serializer error if validation fails
        return data

    def create(self, validated_data):
        # Automatically set the user when creating a new transaction
        user = self.context['request'].user  # Get user from request context
        validated_data['user'] = user
        return Transaction.objects.create(**validated_data)

    def update(self, instance, validated_data):
        # Ensure the user can't be updated; keep the existing user
        validated_data['user'] = instance.user  # Ensure user remains the same
        return super().update(instance, validated_data)
