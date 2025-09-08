from django.contrib.auth.models import User
from core.models import Tag

def run():
    # Tags
    tags = ['Python','ProjectManagement','MarketingAnalytics','Django','React']
    for t in tags:
        Tag.objects.get_or_create(name=t)
    # Users
    if not User.objects.filter(username='alice').exists():
        u = User.objects.create_user('alice', password='pass123')
        u.first_name = 'Alice'; u.last_name = 'Ng'; u.save()
        u.profile.department = 'Engineering'; u.profile.years_experience = 5
        u.profile.save()
    if not User.objects.filter(username='bob').exists():
        u = User.objects.create_user('bob', password='pass123')
        u.first_name = 'Bob'; u.last_name = 'Lee'; u.save()
        u.profile.department = 'Marketing'; u.profile.years_experience = 8
        u.profile.save()
    print('Demo users: alice/pass123, bob/pass123')
