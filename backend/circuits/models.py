from django.db import models

class Circuit(models.Model):
    name = models.CharField(max_length=255, default="New Circuit")
    description = models.TextField(blank=True, default="")
    is_public = models.BooleanField(default=False)
    
    # Store the complete Zustand object (nodes, wires, config)
    state = models.JSONField(help_text="Serialized Zustand state representing electronic components and connections.")
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return self.name
