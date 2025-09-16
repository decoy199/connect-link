from django.test import TestCase, Client
from django.contrib.auth.models import User
from django.urls import reverse
from rest_framework.test import APITestCase
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
import json

from core.models import Question, Answer, Tag, UserProfile, PointTransaction, Notification


class UserRegistrationTest(APITestCase):
    def test_user_registration_success(self):
        """Test successful user registration"""
        data = {
            'email': 'test@example.com',
            'password': 'TestPass123',
            'first_name': 'Test',
            'last_name': 'User',
            'department': 'Engineering',
            'position': 'Developer',
            'expertise_hashtags': 'python, django'
        }
        
        response = self.client.post('/api/register', data)
        self.assertEqual(response.status_code, 201)
        self.assertIn('token', response.data)
        
        # Check user was created
        user = User.objects.get(email='test@example.com')
        self.assertEqual(user.first_name, 'Test')
        self.assertEqual(user.profile.department, 'Engineering')

    def test_user_registration_weak_password(self):
        """Test registration with weak password"""
        data = {
            'email': 'test@example.com',
            'password': '123',
            'first_name': 'Test',
            'last_name': 'User'
        }
        
        response = self.client.post('/api/register', data)
        self.assertEqual(response.status_code, 400)
        self.assertIn('Password must be at least 8 characters long', response.data['detail'])

    def test_user_registration_duplicate_email(self):
        """Test registration with duplicate email"""
        User.objects.create_user(username='existing', email='test@example.com', password='TestPass123')
        
        data = {
            'email': 'test@example.com',
            'password': 'TestPass123',
            'first_name': 'Test',
            'last_name': 'User'
        }
        
        response = self.client.post('/api/register', data)
        self.assertEqual(response.status_code, 400)
        self.assertIn('Email already exists', response.data['detail'])


class QuestionTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123'
        )
        self.token = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token.access_token}')

    def test_create_question(self):
        """Test creating a question"""
        data = {
            'title': 'Test Question',
            'body': 'This is a test question',
            'tags': ['python', 'django'],
            'urgent': False
        }
        
        response = self.client.post('/api/questions', data)
        self.assertEqual(response.status_code, 201)
        
        question = Question.objects.get(title='Test Question')
        self.assertEqual(question.author, self.user)
        self.assertEqual(question.tags.count(), 2)

    def test_create_urgent_question(self):
        """Test creating an urgent question"""
        # Create a user with expertise tags
        expert_user = User.objects.create_user(
            username='expert',
            email='expert@example.com',
            password='TestPass123'
        )
        tag = Tag.objects.create(name='python')
        expert_user.profile.expertise.add(tag)
        
        data = {
            'title': 'Urgent Question',
            'body': 'This is urgent',
            'tags': ['python'],
            'urgent': True
        }
        
        response = self.client.post('/api/questions', data)
        self.assertEqual(response.status_code, 201)
        
        # Check notification was created
        notification = Notification.objects.filter(user=expert_user).first()
        self.assertIsNotNone(notification)
        self.assertIn('URGENT', notification.message)

    def test_get_questions_paginated(self):
        """Test getting paginated questions"""
        # Create some test questions
        for i in range(25):
            Question.objects.create(
                title=f'Question {i}',
                body=f'Body {i}',
                author=self.user
            )
        
        response = self.client.get('/api/questions?page=1&page_size=10')
        self.assertEqual(response.status_code, 200)
        self.assertIn('results', response.data)
        self.assertEqual(len(response.data['results']), 10)
        self.assertEqual(response.data['count'], 25)


class AnswerTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123'
        )
        self.question = Question.objects.create(
            title='Test Question',
            body='Test body',
            author=self.user
        )
        self.token = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token.access_token}')

    def test_create_answer(self):
        """Test creating an answer"""
        data = {
            'body': 'This is a test answer'
        }
        
        response = self.client.post(f'/api/questions/{self.question.id}/answers', data)
        self.assertEqual(response.status_code, 201)
        
        answer = Answer.objects.get(question=self.question)
        self.assertEqual(answer.author, self.user)
        self.assertEqual(answer.body, 'This is a test answer')

    def test_like_answer(self):
        """Test liking an answer"""
        answer = Answer.objects.create(
            question=self.question,
            author=self.user,
            body='Test answer'
        )
        
        response = self.client.post(f'/api/answers/{answer.id}/like')
        self.assertEqual(response.status_code, 200)
        
        answer.refresh_from_db()
        self.assertTrue(answer.likes.filter(id=self.user.id).exists())

    def test_mark_best_answer(self):
        """Test marking best answer"""
        answer = Answer.objects.create(
            question=self.question,
            author=self.user,
            body='Test answer'
        )
        
        response = self.client.post(f'/api/answers/{answer.id}/mark-best')
        self.assertEqual(response.status_code, 200)
        
        self.question.refresh_from_db()
        self.assertEqual(self.question.best_answer, answer)


class PointsTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123'
        )
        self.token = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token.access_token}')

    def test_points_balance(self):
        """Test getting points balance"""
        response = self.client.get('/api/points/balance')
        self.assertEqual(response.status_code, 200)
        self.assertIn('balance', response.data)

    def test_points_transactions(self):
        """Test getting points transactions"""
        # Create some transactions
        PointTransaction.objects.create(
            user=self.user,
            amount=10,
            reason='Test transaction'
        )
        
        response = self.client.get('/api/points/transactions')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['amount'], 10)

    def test_redeem_qr(self):
        """Test QR code redemption"""
        # Give user some points
        self.user.profile.points_balance = 100
        self.user.profile.save()
        
        data = {'amount': 50}
        response = self.client.post('/api/redeem-qr', data)
        self.assertEqual(response.status_code, 200)
        self.assertIn('qr_code', response.data)


class SearchTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123'
        )
        self.token = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token.access_token}')

    def test_search_questions(self):
        """Test searching questions"""
        Question.objects.create(
            title='Python Django Question',
            body='How to use Django?',
            author=self.user
        )
        Question.objects.create(
            title='React Question',
            body='How to use React?',
            author=self.user
        )
        
        response = self.client.get('/api/search?q=python')
        self.assertEqual(response.status_code, 200)
        self.assertGreater(len(response.data), 0)


class NotificationTest(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            username='testuser',
            email='test@example.com',
            password='TestPass123'
        )
        self.token = RefreshToken.for_user(self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Bearer {self.token.access_token}')

    def test_get_notifications(self):
        """Test getting notifications"""
        Notification.objects.create(
            user=self.user,
            message='Test notification'
        )
        
        response = self.client.get('/api/notifications')
        self.assertEqual(response.status_code, 200)
        self.assertEqual(len(response.data), 1)

    def test_mark_notifications_read(self):
        """Test marking notifications as read"""
        notification = Notification.objects.create(
            user=self.user,
            message='Test notification'
        )
        
        response = self.client.post('/api/notifications/read', {'ids': [notification.id]})
        self.assertEqual(response.status_code, 200)
        
        notification.refresh_from_db()
        self.assertTrue(notification.read)
