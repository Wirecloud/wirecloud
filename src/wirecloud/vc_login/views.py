import uuid
from urllib.parse import quote

from django.shortcuts import redirect
from django.contrib.auth import authenticate, login
from django.http import HttpResponse
from django.views.decorators.http import require_http_methods
from django.urls import reverse
from django.conf import settings

from .vc_login import VCLogin
from .exceptions import AccessTokenError, TokenVerificationError

@require_http_methods(["GET"])
def vc_sso_login(request):

    try:
        redirect_uri = request.build_absolute_uri(reverse('vc_sso_callback'))
        state = str(uuid.uuid4())
        nonce = str(uuid.uuid4())
        scope = quote(settings.VC_LOGIN_CONFIG['scope'])
        url = f"{settings.VC_LOGIN_CONFIG['verifier_host']}{settings.VC_LOGIN_CONFIG['verifier_qr_path']}"
        sso_url = (
            f"{url}?"
            f"client_id={settings.VC_LOGIN_CONFIG['client_id']}&"
            f"redirect_uri={redirect_uri}&"
            f"scope={scope}&"
            f"state={state}&"
            f"nonce={nonce}&"
            "response_type=code"
        )

        return redirect(sso_url)

    except Exception as e:
        return HttpResponse(f"Error al iniciar el flujo de login: {e}", status=500)

@require_http_methods(["GET"])
def vc_sso_callback(request):
    """
    Step 2: Receives the request from the VC provider, validates the code/token,
            and starts the Django session.
    """
    code = request.GET.get('code')

    if not code:
        error = request.GET.get('error', 'Code not received.')
        return HttpResponse(f"SSO Error: {error}", status=400)

    try:
        redirect_uri = request.build_absolute_uri(reverse('vc_sso_callback'))
        vc_payload = VCLogin.login(code, redirect_uri)

        if not vc_payload:
            return redirect("/login?error=403001")

        # Authenticate using the Custom Django Backend
        # The backend (VerifiableCredentialBackend) uses 'vc_payload' to find,
        # update, or create the User object.
        user = authenticate(request, vc_payload=vc_payload)

        if user is not None:
            login(request, user)
            return redirect('/')
        else:
            return redirect("/login?error=403002")

    except AccessTokenError as e:
        # Catch errors related to network failures or server-side token rejection
        return HttpResponse(f"Token exchange failed: {e.message}", status=e.status_code)

    except TokenVerificationError as e:
        # Catch errors related to signature failure, token expiration, etc.
        return HttpResponse(f"Token verification failed: {e.message}", status=403)

    except Exception as e:
        # Catch unexpected errors during the process
        return HttpResponse(f"Error in the callback process: {e}", status=500)