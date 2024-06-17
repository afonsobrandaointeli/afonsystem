Descrição do Projeto
--------------------

O objetivo deste projeto é facilitar o registro e a análise das dailies dos alunos, permitindo que as equipes docentes e os próprios alunos possam monitorar o progresso e identificar eventuais impedimentos nas atividades acadêmicas.

### Funcionalidades

* Registro de dailies dos alunos, incluindo informações como turma, grupo, impedimento e grooming.
* Visualização de registros em tabelas filtráveis e ordenáveis.
* Geração de gráficos para análise de dados por turma e por aluno.
* CRUD básico para manipulação de dados.

Requisitos
----------

* Node.js
* Sails.js
* Banco de dados relacional

Instalação
----------

1. Clone o repositório para sua máquina local:
    
    ```bash
    git clone https://github.com/seu-usuario/nome-do-repositorio.git
    ```
    
2. Instale as dependências npm:
    
    ```bash
    cd nome-do-repositorio
    npm install
    ```
    
3. Configure as variáveis de ambiente necessárias, como credenciais do banco de dados, em `config/datastores.js` e `config/env/production.js` (ou `config/env/development.js` para ambiente de desenvolvimento).
    
4. Inicie o servidor Sails:
    
    ```
    sails lift
    ```
    
5. Acesse o aplicativo em seu navegador:
    
    ```bash
    http://localhost:1337
    ```
    

Uso
---

* **Registro de Dailies:** Utilize a página de registro para inserir os dados das dailies dos alunos.
* **Visualização:** Acesse a página de dashboard para visualizar tabelas e gráficos com os registros das dailies.
* **Filtragem e Ordenação:** Utilize os controles na interface para filtrar e ordenar os dados conforme necessário.
* **Gráficos:** Visualize gráficos que mostram quantas dailies foram registradas por turma e detalhes por aluno.

Contribuições
-------------

Contribuições são bem-vindas! Sinta-se à vontade para enviar pull requests com melhorias, correções de bugs ou novas funcionalidades.