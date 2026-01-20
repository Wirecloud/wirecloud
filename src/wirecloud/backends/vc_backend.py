from django.contrib.auth.backends import ModelBackend
from django.contrib.auth import get_user_model
from django.db import IntegrityError
import logging
from wirecloud.vc_login.vc_payload import VCPayload
from django.contrib.auth.models import Group, AbstractUser
from django.conf import settings

# Get the active User model (handles custom user models)
User = get_user_model()
logger = logging.getLogger(__name__)

class VCBackend(ModelBackend):
    """
    Custom authentication backend that provisions (creates) a new user or
    logs in and updates an existing user based on a validated
    Verifiable Credential (VC) payload.
    """

    def authenticate(self, request, vc_payload: VCPayload = None, **kwargs):
        """
        Retrieves user data from the VC payload and handles the login/creation process.
        """
        if vc_payload is None:
            return None

        email = vc_payload.email
        first_name = vc_payload.first_name
        last_name = vc_payload.last_name
        user = None
        roles = self._get_roles(vc_payload)
        if not email:
            logger.error("VC Payload missing required 'email' field for authentication.")
            return None

        try:
            user = User.objects.get(email=email)

            is_updated = False

            if user.first_name != first_name:
                user.first_name = first_name
                is_updated = True
            if user.last_name != last_name:
                user.last_name = last_name
                is_updated = True
            if is_updated:
                user.save()

            logger.info(f"Existing user logged in successfully: {email}")

        except User.DoesNotExist:
            try:
                logger.info(f"User not found. Creating new user: {email}")
                user = User.objects.create_user(
                    username=email,
                    email=email,
                    first_name=first_name,
                    last_name=last_name
                )
                logger.info(f"New user provisioned: {user.username}")

            except IntegrityError:
                logger.warning(f"Integrity conflict during user creation for {email}.")
                return None
            except Exception as e:
                logger.error(f"Unexpected error during user creation: {e}")
                return None
        logger.info("User logged. Assign roles")
        self._assign_roles(roles, user)
        return user

    def get_user(self, user_id):
        """Required method for Django session management."""
        try:
            return User.objects.get(pk=user_id)
        except User.DoesNotExist:
           return None

    def get_groups(self, groups):
        return Group.objects.filter(name__in=groups)

    def _assign_roles(self, user_roles, user: AbstractUser):
        logger.info(f"User roles: {user_roles}")
        allowed_groups = self.get_groups(user_roles)
        if not allowed_groups:
            logger.info("No allowed groups")
            return
        groups_to_add = allowed_groups.exclude(id__in=user.groups.values_list('id', flat=True))
        if groups_to_add.exists():
            groups = ", ".join([g.name for g in groups_to_add])
            logger.info(f"Add user '{user.username}' to groups: {groups}")
            user.groups.add(*groups_to_add)

    def _get_roles(self, vc_payload: VCPayload):
        client_id = settings.VC_LOGIN_CONFIG['role_target']
        if not vc_payload.roles:
            return []
        return next((role['names'] for role in vc_payload.roles if role['target'] == client_id), [])