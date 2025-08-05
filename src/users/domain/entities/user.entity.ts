import { v7 } from 'uuid';

interface UserProps {
  id?: string;
  name: string;
  email: string;
}

export class User {
  id: string;
  name: string;
  email: string;

  constructor(props: UserProps) {
    this.id = props.id ?? v7();
    this.name = props.name;
    this.email = props.email;
  }
}
