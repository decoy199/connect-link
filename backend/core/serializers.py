from rest_framework import serializers
from django.contrib.auth.models import User
from .models import UserProfile, Tag, Question, Answer, PointTransaction, Notification

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id','name']

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id','username','email','first_name','last_name']

class UserProfileSerializer(serializers.ModelSerializer):
    user = UserSerializer(read_only=True)
    expertise = TagSerializer(many=True, read_only=True)
    class Meta:
        model = UserProfile
        fields = ['user','department','position','bio','hobbies','years_experience','expertise','points_balance','avatar_url']

class QuestionSerializer(serializers.ModelSerializer):
    tags = TagSerializer(many=True, read_only=True)
    author = UserSerializer(read_only=True)
    best_answer_id = serializers.IntegerField(source='best_answer.id', read_only=True)
    class Meta:
        model = Question
        fields = ['id','title','body','tags','urgent','author','created_at','best_answer_id','auto_awarded']

class AnswerSerializer(serializers.ModelSerializer):
    author = UserSerializer(read_only=True)
    like_count = serializers.IntegerField(read_only=True)
    class Meta:
        model = Answer
        fields = ['id','question','body','author','created_at','like_count']

class PointTransactionSerializer(serializers.ModelSerializer):
    class Meta:
        model = PointTransaction
        fields = ['id','amount','reason','created_at']

class NotificationSerializer(serializers.ModelSerializer):
    question_id = serializers.IntegerField(source='question.id', read_only=True)
    class Meta:
        model = Notification
        fields = ['id','message','created_at','read','question_id']
