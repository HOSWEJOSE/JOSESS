export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          email: string
          role: 'admin' | 'customer' | 'cashier'
          full_name: string | null
          username: string | null
          created_at: string
        }
        Insert: {
          id: string
          email: string
          role?: 'admin' | 'customer' | 'cashier'
          full_name?: string | null
          username?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          email?: string
          role?: 'admin' | 'customer' | 'cashier'
          full_name?: string | null
          username?: string | null
          created_at?: string
        }
      }
      menu_items: {
        Row: {
          id: string
          name: string
          description: string
          price: number
          image_url: string
          category: string
          stock: number
          is_available: boolean
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          name: string
          description?: string
          price: number
          image_url?: string
          category: string
          stock?: number
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          description?: string
          price?: number
          image_url?: string
          category?: string
          stock?: number
          is_available?: boolean
          created_at?: string
          updated_at?: string
        }
      }
      orders: {
        Row: {
          id: string
          customer_id: string
          total_amount: number
          payment_method: 'counter' | 'gcash' | 'maya'
          payment_status: 'pending' | 'paid' | 'cancelled'
          order_status: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
          order_number: string
          payment_url: string | null
          payment_reference: string | null
          payment_completed_at: string | null
          completed_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          customer_id: string
          total_amount: number
          payment_method: 'counter' | 'gcash' | 'maya'
          payment_status?: 'pending' | 'paid' | 'cancelled'
          order_status?: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
          order_number: string
          payment_url?: string | null
          payment_reference?: string | null
          payment_completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          customer_id?: string
          total_amount?: number
          payment_method?: 'counter' | 'gcash' | 'maya'
          payment_status?: 'pending' | 'paid' | 'cancelled'
          order_status?: 'pending' | 'preparing' | 'ready' | 'completed' | 'cancelled'
          order_number?: string
          payment_url?: string | null
          payment_reference?: string | null
          payment_completed_at?: string | null
          completed_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      order_items: {
        Row: {
          id: string
          order_id: string
          menu_item_id: string
          quantity: number
          price_at_time: number
          subtotal: number
          created_at: string
        }
        Insert: {
          id?: string
          order_id: string
          menu_item_id: string
          quantity: number
          price_at_time: number
          subtotal: number
          created_at?: string
        }
        Update: {
          id?: string
          order_id?: string
          menu_item_id?: string
          quantity?: number
          price_at_time?: number
          subtotal?: number
          created_at?: string
        }
      }
      staff_logs: {
        Row: {
          id: string
          admin_id: string
          staff_name: string
          admin_username: string
          cashier_username: string
          role: string
          logged_in_at: string
        }
        Insert: {
          id?: string
          admin_id: string
          staff_name: string
          admin_username?: string
          cashier_username?: string
          role?: string
          logged_in_at?: string
        }
        Update: {
          id?: string
          admin_id?: string
          staff_name?: string
          admin_username?: string
          cashier_username?: string
          role?: string
          logged_in_at?: string
        }
      }
    }
  }
}
