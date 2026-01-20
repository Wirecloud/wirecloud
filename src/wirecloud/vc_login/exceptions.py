class AccessTokenError(Exception):
    """
    Exception raised when the access token retrieval or exchange fails
    (e.g., connection error, HTTP 4xx/5xx error from the verifier server).
    """
    def __init__(self, message, status_code=500):
        super().__init__(message)
        self.status_code = status_code
        self.message = message

    def __str__(self):
        return f"AccessTokenError [{self.status_code}]: {self.message}"


class TokenVerificationError(Exception):
    """
    Exception raised when the token (JWT) is invalid or cannot be verified
    (e.g., invalid signature, token expiration, incorrect format).
    """
    def __init__(self, message):
        super().__init__(message)
        self.message = message

    def __str__(self):
        return f"TokenVerificationError: {self.message}"