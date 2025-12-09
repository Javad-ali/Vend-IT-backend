import swaggerJsdoc from 'swagger-jsdoc';
import { getConfig } from './config/env.js';
const config = getConfig();
const definition = {
  openapi: '3.1.0',
  info: {
    title: 'Vend-IT API',
    version: '1.0.0',
    description: 'Public HTTP interface for the Vend-IT vending platform.'
  },
  servers: [
    {
      url:
        config.nodeEnv === 'production'
          ? 'https://api.vendit.app/api'
          : 'http://localhost:3000/api',
      description: config.nodeEnv === 'production' ? 'Production' : 'Development'
    }
  ],
  components: {
    securitySchemes: {
      BearerAuth: {
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        description: 'JWT access token issued by /auth/login'
      }
    },
    schemas: {
      HealthResponse: {
        type: 'object',
        properties: {
          status: { type: 'string', example: 'ok' },
          timestamp: { type: 'string', format: 'date-time' },
          uptime: { type: 'number', example: 123.45 },
          env: { type: 'string', example: 'development' }
        }
      },
      PhoneOnlyPayload: {
        type: 'object',
        required: ['countryCode', 'phoneNumber'],
        properties: {
          countryCode: { type: 'string', example: '+965' },
          phoneNumber: { type: 'string', example: '50000000' },
          firstName: { type: 'string', description: 'Optional placeholder first name' },
          lastName: { type: 'string', description: 'Optional placeholder last name' },
          email: {
            type: 'string',
            format: 'email',
            description:
              'Optional placeholder email (actual email can be added later via profile API)'
          },
          deviceType: { type: 'string', example: 'ios' },
          deviceToken: { type: 'string', description: 'Push token captured during onboarding' }
        }
      },
      LoginPayload: { $ref: '#/components/schemas/PhoneOnlyPayload' },
      AuthResponse: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          phoneNumber: { type: 'string' },
          country: { type: 'string', nullable: true },
          countryCode: { type: 'string', nullable: true },
          created_at: { type: 'string', format: 'date-time', nullable: true },
          updated_at: { type: 'string', format: 'date-time', nullable: true },
          isNotification: { type: 'boolean' },
          status: { type: 'integer' },
          otp: { type: 'string', nullable: true },
          token: { type: 'string' },
          refreshToken: { type: 'string' }
        }
      },
      OtpPayload: {
        type: 'object',
        required: ['otp'],
        properties: {
          otp: { type: 'string', example: '1234', minLength: 4, maxLength: 4 },
          deviceType: { type: 'string' },
          deviceToken: { type: 'string' },
          latitude: { type: 'string', example: '29.3759' },
          longitude: { type: 'string', example: '47.9774' }
        }
      },
      ResendOtpPayload: {
        type: 'object',
        properties: {
          deviceType: { type: 'string' },
          deviceToken: { type: 'string' }
        }
      },
      RefreshPayload: {
        type: 'object',
        required: ['refreshToken'],
        properties: {
          refreshToken: { type: 'string', description: 'JWT issued by /auth/login or /auth/verify' }
        }
      },
      UserProfile: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          email: { type: 'string', format: 'email' },
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          phoneNumber: { type: 'string' },
          avatarUrl: { type: 'string', nullable: true }
        }
      },
      EditProfilePayload: {
        type: 'object',
        properties: {
          firstName: { type: 'string' },
          lastName: { type: 'string' },
          phoneNumber: { type: 'string' },
          avatar: { type: 'string', format: 'binary' }
        }
      },
      Machine: {
        type: 'object',
        properties: {
          u_id: { type: 'string' },
          machine_tag: { type: 'string' },
          location_address: { type: 'string' },
          machine_image_url: { type: 'string', nullable: true }
        }
      },
      Product: {
        type: 'object',
        properties: {
          product_u_id: { type: 'string' },
          description: { type: 'string' },
          unit_price: { type: 'number' },
          brand_name: { type: 'string' },
          product_image_url: { type: 'string' }
        }
      },
      Category: {
        type: 'object',
        properties: {
          id: { type: 'string' },
          category_name: { type: 'string' }
        }
      },
      CartProductLine: {
        type: 'object',
        required: ['productId', 'quantity'],
        properties: {
          productId: { type: 'string' },
          quantity: { type: 'integer', minimum: 1 }
        }
      },
      CartItemPayload: {
        type: 'object',
        required: ['machineId', 'slotNumber', 'quantity'],
        properties: {
          machineId: { type: 'string' },
          slotNumber: { type: 'string' },
          quantity: { type: 'integer', minimum: 1 }
        }
      },
      WalletChargePayload: {
        type: 'object',
        required: ['amount', 'tapCustomerId', 'tapCardId'],
        properties: {
          amount: { type: 'number' },
          tapCustomerId: { type: 'string' },
          tapCardId: { type: 'string' },
          machineId: { type: 'string', nullable: true }
        }
      },
      WalletPayPayload: {
        type: 'object',
        required: ['amount', 'machineId', 'products'],
        properties: {
          amount: { type: 'number' },
          machineId: { type: 'string' },
          products: { type: 'array', items: { $ref: '#/components/schemas/CartProductLine' } }
        }
      },
      CardPayPayload: {
        type: 'object',
        required: ['cardId', 'customerId', 'amount', 'machineId', 'products'],
        properties: {
          cardId: { type: 'string' },
          customerId: { type: 'string' },
          amount: { type: 'number' },
          machineId: { type: 'string' },
          products: { type: 'array', items: { $ref: '#/components/schemas/CartProductLine' } }
        }
      },
      ContactPayload: {
        type: 'object',
        required: ['subject', 'message'],
        properties: {
          subject: { type: 'string' },
          message: { type: 'string' }
        }
      },
      RatingPayload: {
        type: 'object',
        required: ['rating'],
        properties: {
          rating: { type: 'integer', minimum: 1, maximum: 5 },
          comment: { type: 'string' }
        }
      },
      NotificationPayload: {
        type: 'object',
        required: ['receiverId', 'title', 'body'],
        properties: {
          receiverId: { type: 'string' },
          title: { type: 'string' },
          body: { type: 'string' },
          type: { type: 'string' },
          data: { type: 'object', additionalProperties: true }
        }
      },
      MessageResponse: {
        type: 'object',
        properties: {
          status: { type: 'number', example: 200 },
          message: { type: 'string', example: 'OTP sent' },
          data: {
            oneOf: [
              { type: 'null' },
              {
                type: 'object',
                properties: {
                  otp: { type: 'string', example: '1234' }
                }
              }
            ]
          }
        }
      }
    }
  },
  paths: {
    '/health': {
      get: {
        summary: 'Health check',
        tags: ['Health'],
        responses: {
          200: {
            description: 'API is healthy',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/HealthResponse' } }
            }
          }
        }
      }
    },
    '/auth/register': {
      post: {
        summary: 'Start registration (send OTP)',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/PhoneOnlyPayload' } }
          }
        },
        responses: {
          200: {
            description: 'User record plus token and OTP (OTP echoed in non-production)',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } }
            }
          },
          409: { description: 'Phone already verified' }
        }
      }
    },
    '/auth/login': {
      post: {
        summary: 'Login (also sends OTP)',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/LoginPayload' } } }
        },
        responses: {
          200: {
            description: 'Existing user with token and OTP (OTP echoed in non-production)',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } }
            }
          },
          404: { description: 'User not found' }
        }
      }
    },
    '/auth/logout': {
      post: {
        summary: 'Logout current session',
        tags: ['Auth'],
        security: [{ BearerAuth: [] }],
        responses: { 204: { description: 'Logged out' } }
      }
    },
    '/auth/verify': {
      post: {
        summary: 'Verify OTP code',
        tags: ['Auth'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: { 'application/json': { schema: { $ref: '#/components/schemas/OtpPayload' } } }
        },
        responses: {
          200: {
            description: 'OTP verified and new token issued',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } }
            }
          },
          400: { description: 'Invalid OTP' }
        }
      }
    },
    '/auth/resend': {
      post: {
        summary: 'Resend OTP',
        tags: ['Auth'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ResendOtpPayload' } }
          }
        },
        responses: {
          200: {
            description: 'OTP resent',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/MessageResponse' } }
            }
          }
        }
      }
    },
    '/auth/refresh': {
      post: {
        summary: 'Refresh access token',
        tags: ['Auth'],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/RefreshPayload' } },
            'multipart/form-data': { schema: { $ref: '#/components/schemas/RefreshPayload' } }
          }
        },
        responses: {
          200: {
            description: 'New access/refresh token pair',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/AuthResponse' } }
            }
          },
          401: { description: 'Invalid refresh token' }
        }
      }
    },
    '/users/create-profile': {
      post: {
        summary: 'Create profile shell',
        tags: ['Users'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          required: true,
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/EditProfilePayload' } }
          }
        },
        responses: { 201: { description: 'Profile created' } }
      }
    },
    '/users/profile': {
      get: {
        summary: 'Current profile',
        tags: ['Users'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Profile data',
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/UserProfile' } }
            }
          }
        }
      }
    },
    '/users/edit-profile': {
      put: {
        summary: 'Edit profile',
        tags: ['Users'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            'multipart/form-data': { schema: { $ref: '#/components/schemas/EditProfilePayload' } }
          }
        },
        responses: { 200: { description: 'Profile updated' } }
      }
    },
    '/users/delete': {
      delete: {
        summary: 'Delete user account',
        tags: ['Users'],
        security: [{ BearerAuth: [] }],
        responses: { 204: { description: 'Account deleted' } }
      }
    },
    '/machines': {
      get: {
        summary: 'List machines near coordinates',
        tags: ['Machines'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'query', name: 'lat', schema: { type: 'number' }, required: true },
          { in: 'query', name: 'lng', schema: { type: 'number' }, required: true }
        ],
        responses: {
          200: {
            description: 'Array of machines',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Machine' } }
              }
            }
          }
        }
      }
    },
    '/machines/sync': {
      post: {
        summary: 'Trigger remote sync',
        tags: ['Machines'],
        responses: { 202: { description: 'Sync queued' } }
      }
    },
    '/machines/{machineId}': {
      get: {
        summary: 'Machine detail',
        tags: ['Machines'],
        security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'machineId', required: true, schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Machine payload',
            content: { 'application/json': { schema: { $ref: '#/components/schemas/Machine' } } }
          },
          404: { description: 'Not found' }
        }
      }
    },
    '/machines/{machineId}/qr': {
      post: {
        summary: 'Generate machine QR (admin)',
        tags: ['Machines'],
        parameters: [{ in: 'path', name: 'machineId', required: true, schema: { type: 'string' } }],
        responses: { 200: { description: 'QR regenerated' } }
      }
    },
    '/machines/webhooks/silkron': {
      post: {
        summary: 'Silkron webhook',
        tags: ['Webhooks'],
        responses: { 200: { description: 'Accepted' }, 401: { description: 'Invalid signature' } }
      }
    },
    '/machines/webhooks/tap': {
      post: {
        summary: 'Tap webhook',
        tags: ['Webhooks'],
        responses: { 200: { description: 'Accepted' }, 401: { description: 'Invalid signature' } }
      }
    },
    '/products': {
      get: {
        summary: 'List products',
        tags: ['Products'],
        security: [{ BearerAuth: [] }],
        parameters: [{ in: 'query', name: 'machineId', schema: { type: 'string' } }],
        responses: {
          200: {
            description: 'Product list',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Product' } }
              }
            }
          }
        }
      }
    },
    '/products/categories': {
      get: {
        summary: 'Product categories',
        tags: ['Products'],
        security: [{ BearerAuth: [] }],
        responses: {
          200: {
            description: 'Category list',
            content: {
              'application/json': {
                schema: { type: 'array', items: { $ref: '#/components/schemas/Category' } }
              }
            }
          }
        }
      }
    },
    '/products/{productId}': {
      get: {
        summary: 'Single product',
        tags: ['Products'],
        security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'productId', schema: { type: 'string' }, required: true }],
        responses: { 200: { description: 'Product detail' }, 404: { description: 'Not found' } }
      }
    },
    '/cart': {
      get: {
        summary: 'Get cart',
        tags: ['Cart'],
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Cart contents' } }
      },
      post: {
        summary: 'Add to cart',
        tags: ['Cart'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CartItemPayload' } }
          }
        },
        responses: { 200: { description: 'Item added' } }
      },
      delete: {
        summary: 'Clear cart',
        tags: ['Cart'],
        security: [{ BearerAuth: [] }],
        responses: { 204: { description: 'Cart cleared' } }
      }
    },
    '/cart/{cartId}': {
      put: {
        summary: 'Update cart item',
        tags: ['Cart'],
        security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'cartId', required: true, schema: { type: 'string' } }],
        requestBody: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CartItemPayload' } }
          }
        },
        responses: { 200: { description: 'Cart updated' } }
      },
      delete: {
        summary: 'Remove cart item',
        tags: ['Cart'],
        security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'cartId', required: true, schema: { type: 'string' } }],
        responses: { 204: { description: 'Item removed' } }
      }
    },
    '/payments/cards': {
      get: {
        summary: 'List cards',
        tags: ['Payments'],
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Cards array' } }
      },
      post: {
        summary: 'Save card',
        tags: ['Payments'],
        security: [{ BearerAuth: [] }],
        responses: { 201: { description: 'Card created' } }
      }
    },
    '/payments/cards/{cardId}': {
      delete: {
        summary: 'Delete card',
        tags: ['Payments'],
        security: [{ BearerAuth: [] }],
        parameters: [{ in: 'path', name: 'cardId', schema: { type: 'string' }, required: true }],
        responses: { 204: { description: 'Card deleted' } }
      }
    },
    '/payments/wallet/charge': {
      post: {
        summary: 'Charge wallet',
        tags: ['Payments'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/WalletChargePayload' } }
          }
        },
        responses: { 200: { description: 'Wallet charged' } }
      }
    },
    '/payments/wallet/pay': {
      post: {
        summary: 'Wallet purchase',
        tags: ['Payments'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/WalletPayPayload' } }
          }
        },
        responses: { 200: { description: 'Payment completed' } }
      }
    },
    '/payments/card/pay': {
      post: {
        summary: 'Card purchase',
        tags: ['Payments'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/CardPayPayload' } }
          }
        },
        responses: { 200: { description: 'Card charged' } }
      }
    },
    '/payments/gpay/token': {
      post: {
        summary: 'Google Pay token exchange',
        tags: ['Payments'],
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Token stored' } }
      }
    },
    '/payments/gpay/pay': {
      post: {
        summary: 'Google Pay purchase',
        tags: ['Payments'],
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Payment completed' } }
      }
    },
    '/payments/ios/pay': {
      post: {
        summary: 'Apple Pay purchase',
        tags: ['Payments'],
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Payment completed' } }
      }
    },
    '/payments/history': {
      get: {
        summary: 'Payment history',
        tags: ['Payments'],
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'History list' } }
      }
    },
    '/payments/wallet/history': {
      get: {
        summary: 'Wallet history',
        tags: ['Payments'],
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'History list' } }
      }
    },
    '/payments/orders/history': {
      get: {
        summary: 'Order history',
        tags: ['Payments'],
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'History list' } }
      }
    },
    '/payments/loyalty/history': {
      get: {
        summary: 'Loyalty history',
        tags: ['Payments'],
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'History list' } }
      }
    },
    '/payments/dispense': {
      post: {
        summary: 'Update dispense status',
        tags: ['Payments'],
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Dispense updated' } }
      }
    },
    '/content/static': {
      get: {
        summary: 'Static CMS content',
        tags: ['Content'],
        responses: { 200: { description: 'Content blob' } }
      }
    },
    '/content/contact': {
      post: {
        summary: 'Contact us form',
        tags: ['Content'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/ContactPayload' } }
          }
        },
        responses: { 200: { description: 'Submission accepted' } }
      }
    },
    '/feedback/ratings': {
      get: {
        summary: 'Ratings list',
        tags: ['Feedback'],
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Ratings array' } }
      },
      post: {
        summary: 'Leave rating',
        tags: ['Feedback'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/RatingPayload' } }
          }
        },
        responses: { 201: { description: 'Created' } }
      }
    },
    '/notifications': {
      get: {
        summary: 'List notifications',
        tags: ['Notifications'],
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Notifications array' } }
      },
      post: {
        summary: 'Send notification',
        tags: ['Notifications'],
        security: [{ BearerAuth: [] }],
        requestBody: {
          content: {
            'application/json': { schema: { $ref: '#/components/schemas/NotificationPayload' } }
          }
        },
        responses: { 201: { description: 'Notification enqueued' } }
      },
      delete: {
        summary: 'Clear notifications',
        tags: ['Notifications'],
        security: [{ BearerAuth: [] }],
        responses: { 204: { description: 'Cleared' } }
      }
    },
    '/notifications/{notificationId}/read': {
      patch: {
        summary: 'Mark notification read',
        tags: ['Notifications'],
        security: [{ BearerAuth: [] }],
        parameters: [
          { in: 'path', name: 'notificationId', required: true, schema: { type: 'string' } }
        ],
        responses: { 200: { description: 'Updated' } }
      }
    },
    '/campaigns/latest': {
      get: {
        summary: 'Latest campaign',
        tags: ['Campaigns'],
        security: [{ BearerAuth: [] }],
        responses: { 200: { description: 'Current campaign or 204 if none' } }
      }
    }
  }
};
export const openapiSpec = swaggerJsdoc({ definition, apis: [] });
