# Metrics Aggregation and Reporting System

Este projeto é um sistema de agregação de métricas e geração de relatórios, desenvolvido com **NestJS** e **TypeORM**. Ele permite a agregação de métricas por diferentes períodos (dia, mês ou ano), processando dados armazenados em um banco de dados, e gerando relatórios em formato **Excel** para análise.

## Funcionalidades principais

- **Agregação de métricas**: Agrega dados de métricas com base em intervalos de tempo, como dia, mês ou ano.
- **Importação de dados**: Suporta a importação de métricas a partir de arquivos CSV, validando e salvando os dados no banco de dados.
- **Geração de relatórios**: Permite a criação de relatórios em formato Excel com as métricas agregadas, oferecendo uma visão detalhada das métricas para cada intervalo de tempo.
- **Integração com banco de dados**: Utiliza o **TypeORM** para comunicação com o banco de dados, suportando diferentes tipos de banco como PostgreSQL e MySQL.
- **Suporte a múltiplos tipos de agregação**: Agrega as métricas conforme o tipo de agregação selecionado (dia, mês ou ano).

## Tecnologias utilizadas

- **NestJS**: Framework para construção de aplicações server-side em Node.js.
- **TypeORM**: ORM (Object Relational Mapping) para TypeScript e JavaScript, utilizado para gerenciar a persistência de dados.
- **ExcelJS**: Biblioteca para gerar e manipular arquivos Excel.
- **Day.js**: Biblioteca para manipulação de datas e horários.
- **CSV Parser**: Para ler e processar arquivos CSV.

## Como executar o projeto

1. Instalar as dependências:
   npm install
2. Iniciar o servidor:
   npm run start

## Estrutura do projeto

- **src**: Contém o código-fonte do projeto.
  - **metrics**: Módulo responsável pelo gerenciamento das métricas.
    - **entities**: Contém as entidades do banco de dados.
    - **dto**: Contém os objetos de transferência de dados (DTOs).
    - **services**: Contém a lógica de negócios, incluindo a agregação de métricas e a geração de relatórios.
- **.gitignore**: Arquivo de configuração para ignorar arquivos desnecessários no controle de versão, como `node_modules`, arquivos de log e arquivos temporários.

# API de Métricas

Este projeto fornece uma API para gerenciar métricas, incluindo a agregação, geração de relatórios e importação de dados a partir de arquivos CSV. A seguir estão os detalhes sobre os endpoints disponíveis.

## Endpoints

### 1. **POST /metrics/aggregate**

#### Descrição:
Este endpoint recebe um conjunto de parâmetros de agregação e retorna as métricas agregadas conforme o tipo (dia, mês ou ano).

#### Requisição:
- **Corpo (JSON):**

```json
{
  "metricId": 71590,
  "aggType": "DAY",
  "dateInitial": "2023-11-21",
  "finalDate": "2023-11-22"
}
```

## Parâmetros

- **metricId**: ID da métrica a ser consultada.
- **aggType**: Tipo de agregação, que pode ser `DAY`, `MONTH`, ou `YEAR`.
- **dateInitial**: Data inicial do intervalo (formato `YYYY-MM-DD`).
- **finalDate**: Data final do intervalo (formato `YYYY-MM-DD`).

## Resposta
   - **Sucesso (200 OK)**:
  ```json
  {
    "date": "2023-11-21",
    "value": 267
  },
  {
    "date": "2023-11-22",
    "value": 97
  }
 ```
### 2. **POST /metrics/report**

#### Descrição:
Este endpoint gera um relatório Excel com as métricas agregadas conforme os parâmetros informados.

#### Requisição:
- **Corpo (JSON):**

```json
{
  "metricId": 71590,
  "aggType": "DAY",
  "dateInitial": "2023-11-21",
  "finalDate": "2023-11-22"
}
```
## Parâmetros

- **metricId**: ID da métrica a ser consultada.
- **aggType**: Tipo de agregação, que pode ser `DAY`, `MONTH`, ou `YEAR`.
- **dateInitial**: Data inicial do intervalo (formato `YYYY-MM-DD`).
- **finalDate**: Data final do intervalo (formato `YYYY-MM-DD`).

## Resposta
   - **Sucesso (200 OK)**: Um arquivo Excel será gerado e enviado como resposta.

### 3. **POST /metrics/import**

#### Descrição:
Este endpoint permite a importação de dados de métricas a partir de um arquivo CSV. O arquivo CSV deve estar localizado no diretório src/media/ e ter o nome METRICS_IMPORT.csv.

#### Requisição:
- **Não é necessário fornecer um corpo na requisição.**

## Parâmetros
- **Não é necessário fornecer parâmetros na requisição.**

## Resposta
   - **Sucesso (200 OK)**: 
```json 
{"message": "Metrics imported successfully!"}
```
