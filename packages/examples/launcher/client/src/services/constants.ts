enum HttpStatusCode {
  /**
   * Standard response for successful HTTP requests.
   * The actual response will depend on the request method used.
   * In a GET request, the response will contain an entity corresponding to the requested resource.
   * In a POST request, the response will contain an entity describing or containing the result of the action.
   */
  OK = 200,

  /**
   * The request has been fulfilled, resulting in the creation of a new resource.
   */
  CREATED = 201,

  /**
   * The request has been accepted for processing, but the processing has not been completed.
   * The request might or might not be eventually acted upon, and may be disallowed when processing occurs.
   */
  ACCEPTED = 202,

  /**
   * SINCE HTTP/1.1
   * The server is a transforming proxy that received a 200 OK from its origin,
   * but is returning a modified version of the origin's response.
   */
  NON_AUTHORITATIVE_INFORMATION = 203,

  /**
   * The server successfully processed the request and is not returning any content.
   */
  NO_CONTENT = 204,

  /**
   * The server cannot or will not process the request due to an apparent client error
   * (e.g., malformed request syntax, too large size, invalid request message framing, or deceptive request routing).
   */
  BAD_REQUEST = 400,

  /**
   * Similar to 403 Forbidden, but specifically for use when authentication is required and has failed or has not yet
   * been provided. The response must include a WWW-Authenticate header field containing a challenge applicable to the
   * requested resource. See Basic access authentication and Digest access authentication. 401 semantically means
   * "unauthenticated",i.e. the user does not have the necessary credentials.
   */
  UNAUTHORIZED = 401,

  /**
   * Reserved for future use. The original intention was that this code might be used as part of some form of digital
   * cash or micro payment scheme, but that has not happened, and this code is not usually used.
   * Google Developers API uses this status if a particular developer has exceeded the daily limit on requests.
   */
  PAYMENT_REQUIRED = 402,

  /**
   * The request was valid, but the server is refusing action.
   * The user might not have the necessary permissions for a resource.
   */
  FORBIDDEN = 403,

  /**
   * The requested resource could not be found but may be available in the future.
   * Subsequent requests by the client are permissible.
   */
  NOT_FOUND = 404,

  /**
   * A request method is not supported for the requested resource;
   * for example, a GET request on a form that requires data to be presented via POST, or a PUT request on a read-only resource.
   */
  METHOD_NOT_ALLOWED = 405,

  /**
   * A generic error message, given when an unexpected condition was encountered and no more specific message is suitable.
   */

  INTERNAL_SERVER_ERROR = 500,

  /**
   * The server either does not recognize the request method, or it lacks the ability to fulfill the request.
   * Usually this implies future availability (e.g., a new feature of a web-service API).
   */
  NOT_IMPLEMENTED = 501,

  /**
   * The server was acting as a gateway or proxy and received an invalid response from the upstream server.
   */
  BAD_GATEWAY = 502,

  /**
   * The server is currently unavailable (because it is overloaded or down for maintenance).
   * Generally, this is a temporary state.
   */
  SERVICE_UNAVAILABLE = 503,

  /**
   * The server was acting as a gateway or proxy and did not receive a timely response from the upstream server.
   */
  GATEWAY_TIMEOUT = 504,

  /**
   * The server does not support the HTTP protocol version used in the request
   */
  HTTP_VERSION_NOT_SUPPORTED = 505,

  /**
   * The client needs to authenticate to gain network access.
   * Intended for use by intercepting proxies used to control access to the network (e.g., "captive portals" used
   * to require agreement to Terms of Service before granting full Internet access via a Wi-Fi hotspot).
   */
  NETWORK_AUTHENTICATION_REQUIRED = 511,
}

export default HttpStatusCode;
