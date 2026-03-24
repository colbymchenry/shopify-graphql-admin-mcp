import type { GraphQLClient } from "./client.js";

const INTROSPECTION_QUERY = `
query IntrospectionQuery {
  __schema {
    queryType { name }
    mutationType { name }
    types {
      kind
      name
      description
      fields(includeDeprecated: false) {
        name
        description
        args {
          name
          description
          type {
            ...TypeRef
          }
          defaultValue
        }
        type {
          ...TypeRef
        }
      }
      inputFields {
        name
        description
        type {
          ...TypeRef
        }
        defaultValue
      }
      interfaces {
        ...TypeRef
      }
      enumValues(includeDeprecated: false) {
        name
        description
      }
      possibleTypes {
        ...TypeRef
      }
    }
  }
}

fragment TypeRef on __Type {
  kind
  name
  ofType {
    kind
    name
    ofType {
      kind
      name
      ofType {
        kind
        name
        ofType {
          kind
          name
          ofType {
            kind
            name
            ofType {
              kind
              name
            }
          }
        }
      }
    }
  }
}
`;

export interface IntrospectedTypeRef {
  kind: string;
  name: string | null;
  ofType?: IntrospectedTypeRef | null;
}

export interface IntrospectedField {
  name: string;
  description: string | null;
  args?: IntrospectedArg[];
  type: IntrospectedTypeRef;
}

export interface IntrospectedArg {
  name: string;
  description: string | null;
  type: IntrospectedTypeRef;
  defaultValue: string | null;
}

export interface IntrospectedEnumValue {
  name: string;
  description: string | null;
}

export interface IntrospectedType {
  kind: string;
  name: string;
  description: string | null;
  fields: IntrospectedField[] | null;
  inputFields: IntrospectedArg[] | null;
  interfaces: IntrospectedTypeRef[] | null;
  enumValues: IntrospectedEnumValue[] | null;
  possibleTypes: IntrospectedTypeRef[] | null;
}

export interface IntrospectedSchema {
  queryTypeName: string;
  mutationTypeName: string;
  types: IntrospectedType[];
}

export async function runIntrospection(
  client: GraphQLClient
): Promise<IntrospectedSchema> {
  const res = await client.execute(INTROSPECTION_QUERY);

  if (res.errors) {
    throw new Error(
      `Introspection failed: ${res.errors.map((e) => e.message).join(", ")}`
    );
  }

  const schema = (res.data as { __schema: Record<string, unknown> }).__schema;

  return {
    queryTypeName: (schema.queryType as { name: string })?.name ?? "QueryRoot",
    mutationTypeName:
      (schema.mutationType as { name: string })?.name ?? "Mutation",
    types: schema.types as IntrospectedType[],
  };
}
