class VCPayload:

    def __init__(
            self, email,
            first_name='',
            last_name='',
            refresh_token='',
            roles=[],
            type=''):

        self.email = email
        self.first_name = first_name
        self.last_name = last_name
        self.refresh_token=refresh_token
        self.roles = roles
        self.type = type
