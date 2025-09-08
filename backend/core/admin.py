from django.contrib import admin
from .models import UserProfile, Tag, Question, Answer, PointTransaction, ChatLog, Notification

admin.site.register(UserProfile)
admin.site.register(Tag)
admin.site.register(Question)
admin.site.register(Answer)
admin.site.register(PointTransaction)
admin.site.register(ChatLog)
admin.site.register(Notification)
