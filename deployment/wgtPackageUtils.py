import os, zipfile

class WgtPackageUtils:
	def __init__(self):
		self.extension = ".wgt"

    # create a new widget package
	def create(self, file, filename):
		zip_file = zipfile.ZipFile(filename+self.extension, 'w')
		if os.path.isfile(file):
			# Add file to a wgt file
			zip_file.write(file)
		else:
			# Add folder to a wgt file
			self.addFolder(zip_file, file)
		zip_file.close()


	# Add a folder to wgt file
	def addFolder(self, zip_file, folder):
		# check if folder is empty 
		if(not len(os.listdir(folder))):
			zip_file.write(folder + "/")
       
		for file in os.listdir(folder):
			full_path = os.path.join(folder, file)
			if os.path.isfile(full_path):
				zip_file.write(full_path)
			elif os.path.isdir(full_path):
				self.addFolder(zip_file, full_path)
    
	# Extract a wgt file
	def extract(self, file, path):
		if (not os.path.exists(path)) or ((os.path.exists(path)) 
			and (not os.path.isdir(path))):
			os.mkdir(path, 0777)
		zip_file = zipfile.ZipFile(file)
		for name in zip_file.namelist():
			listnames = name.split('/')[:-1]
			folder = path
			if name.endswith('/'):
				for namedir in listnames:
					folder+='/'+namedir
					if (not os.path.exists(folder)) or ((os.path.exists(folder)) 
						and (not os.path.isdir(folder))):
						os.mkdir(folder)
			else:
				for namedir in listnames:
					folder+='/'+namedir
					if (not os.path.exists(folder)) or ((os.path.exists(folder)) 
						and (not os.path.isdir(folder))):
						os.mkdir(folder)
				outfile = open(os.path.join(path, name), 'wb')
				outfile.write(zip_file.read(name))
				outfile.close()
