mod schema {
  cynic::use_schema!("schemas/escrow.graphql");
}

#[derive(cynic::QueryFragment, Debug)]
#[cynic(schema_path = "schemas/escrow.graphql")]
pub struct EscrowData {
  pub id: String,
  pub address: String,
  pub amount_paid: cynic::Id,
  pub balance: cynic::Id,
  pub count: cynic::Id,
  pub factory_address: String,
  pub launcher: String,
  pub status: Option<String>,
  pub token: String,
  pub total_funded_amount: cynic::Id,
  pub created_at: String,
  pub final_results_url: Option<String>,
  pub intermediate_results_url: Option<String>,
  pub manifest_hash: Option<String>,
  pub manifest_url: Option<String>,
  pub recording_oracle: Option<String>,
  pub recording_oracle_fee: Option<cynic::Id>,
  pub reputation_oracle: Option<String>,
  pub reputation_oracle_fee: Option<cynic::Id>,
  pub exchange_oracle: Option<String>,
  pub exchange_oracle_fee: Option<cynic::Id>,
}

#[derive(cynic::QueryVariables, Clone)]
pub struct EscrowFilter {
  pub id: String,
}

#[derive(cynic::QueryFragment, Debug)]
#[cynic(graphql_type = "Root", variables = "EscrowFilter")]
#[cynic(schema_path = "schemas/escrow.graphql")]
pub struct GetEscrowByAddressQuery {
  #[arguments(id: $id)]
  pub escrow: Option<EscrowData>,
}

pub async fn run_query(url: &str, filter: &EscrowFilter) -> cynic::GraphQlResponse<GetEscrowByAddressQuery> {
  use cynic::http::ReqwestExt;

  let query = build_query(filter);
  
  reqwest::Client::new()
    .post(url)
    .run_graphql(query)
    .await
    .unwrap()
}

fn build_query(filter: &EscrowFilter) -> cynic::Operation<GetEscrowByAddressQuery, EscrowFilter> {
  use cynic::QueryBuilder;

  GetEscrowByAddressQuery::build(filter.clone())
}

#[cfg(test)]
mod test {
    use super::*;
    use tokio::test;

    #[test]
    async fn snapshot_test_query() {
      let filter = EscrowFilter {
        id: "some_escrow_address".into()
      };
      let query = build_query(&filter);

      insta::assert_snapshot!(query.query);
    }

    #[tokio::test]
    async fn test_running_query() {
      let filter = EscrowFilter {
        id: "0x01fc22166dbf5743472ea56e2a1bc8372377e402".into()
      };
      let result = run_query("https://api.thegraph.com/subgraphs/name/humanprotocol/mumbai-v2", &filter).await;
      if let Some(errors) = &result.errors {
          assert_eq!(errors.len(), 0);
      }
      insta::assert_debug_snapshot!(result.data);
    }

    #[tokio::test]
    async fn test_filter_builder() {
        let filter = EscrowFilter {
          id: "some_escrow_address".into()
        };

        assert_eq!(filter.id, "some_escrow_address".to_string());
    }
}