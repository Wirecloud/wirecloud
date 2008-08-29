from workspace.models import WorkSpaceVariable, AbstractVariable
from igadget.models import Variable

from django.db import models

class PackageLinker:
    def link_workspace(self, workspace, user):
        # Linking user to workspace
        self.add_user_to_workspace(workspace, user)
        
        # Getting all abstract variables of workspace
        ws_igadget_vars = Variable.objects.filter(igadget__tab__workspace=workspace)
        
        ws_vars = WorkSpaceVariable.objects.filter(workspace=workspace)
        
        abstract_var_list = self.get_abstract_var_list(ws_igadget_vars, ws_vars)
        
        # Creating new VariableValue to each AbstractVariable
        # Linking each new VariableValue to the user argument
        self.add_value_to_abstract_variable_list(abstract_var_list, user)

    def add_user_to_workspace(self, workspace, user):
        pass

    def add_value_to_abstract_variable_list(self, abstract_var, user):
        pass
    
    def get_abstract_var_list(self, ws_igadget_vars, ws_vars):
        pass