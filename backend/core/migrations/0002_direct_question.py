from django.db import migrations, models
import django.db.models.deletion
from django.conf import settings

class Migration(migrations.Migration):

    dependencies = [
        ('core', '0001_initial'),
    ]

    operations = [
        migrations.CreateModel(
            name='DirectQuestion',
            fields=[
                ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                ('title', models.CharField(max_length=200)),
                ('body', models.TextField(blank=True)),
                ('created_at', models.DateTimeField(auto_now_add=True)),
                ('recipient', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='direct_questions_received', to=settings.AUTH_USER_MODEL)),
                ('sender', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='direct_questions_sent', to=settings.AUTH_USER_MODEL)),
                ('tags', models.ManyToManyField(blank=True, related_name='direct_questions', to='core.tag')),
            ],
            options={
                'ordering': ['-created_at'],
            },
        ),
        migrations.AddIndex(
            model_name='directquestion',
            index=models.Index(fields=['sender'], name='core_dq_sender_idx'),
        ),
        migrations.AddIndex(
            model_name='directquestion',
            index=models.Index(fields=['recipient'], name='core_dq_recipient_idx'),
        ),
        migrations.AddIndex(
            model_name='directquestion',
            index=models.Index(fields=['-created_at'], name='core_dq_created_idx'),
        ),
    ]
