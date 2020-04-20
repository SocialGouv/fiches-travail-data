#

__dirname=$(dirname $(readlink -f $0))

curl -sL \
  https://travail-emploi.gouv.fr/droit-du-travail/les-absences-pour-maladie-et-conges-pour-evenements-familiaux/article/les-conges-pour-evenements-familiaux \
  > "${__dirname}/les-conges-pour-evenements-familiaux.html"
