#!/bin/bash
# tu nombre de usuario tiene que existir como superusuario de postgresq

echo "Borrando base de datos. Desea continuar? Control-C para parar"
read

dropdb ezweb
createdb --owner=ezweb ezweb

if (( $? )) ; then
  echo "No se puede crear la base de datos. (Mira que Django no está corriendo y prueba de nuevo.)"
  exit 1
fi
./manage.py syncdb --settings=settings

if (( $? )) ; then
  echo "No se puede crear el nuevo esquema (syncdb). "
  exit 1
fi
