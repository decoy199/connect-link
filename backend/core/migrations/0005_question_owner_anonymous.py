from django.db import migrations, models
import django.db.models.deletion


def forwards(apps, schema_editor):
    Question = apps.get_model("core", "Question")
  
    for q in Question.objects.all().only("id", "author_id"):
        if q.author_id and getattr(q, "created_by_id", None) is None:
            Question.objects.filter(id=q.id).update(created_by_id=q.author_id)


def backwards(apps, schema_editor):
    
    pass


class Migration(migrations.Migration):

    dependencies = [
        
        ('core', '0004_alter_answer_options_alter_chatlog_options_and_more'),
    ]

    operations = [
        migrations.AddField(
            model_name="question",
            name="created_by",
            field=models.ForeignKey(
                related_name="questions_created",
                null=True,
                on_delete=django.db.models.deletion.SET_NULL,
                to="auth.user",
                help_text="Actual creator (always set), even when author is hidden (anonymous).",
            ),
        ),
        migrations.RunPython(forwards, backwards),
        migrations.AddIndex(
            model_name="question",
            index=models.Index(
                fields=["created_by", "-created_at"],
                name="core_q_owner_ctime_idx",
            ),
        ),
    ]
