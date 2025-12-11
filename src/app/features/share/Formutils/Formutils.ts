import { FormGroup, ValidationErrors } from '@angular/forms';

export class FormUtils {

  // Método para saber si un campo es inválido y fue tocado
  static isValidField(form: FormGroup, fieldName: string): boolean | null {
    return form.controls[fieldName].errors && form.controls[fieldName].touched;
  }

  // Método para obtener el mensaje de error exacto
  static getFieldError(form: FormGroup, fieldName: string): string | null {
    const errors: ValidationErrors | null = form.controls[fieldName].errors;

    if (!errors) return null;

    // Aquí manejas todos los errores posibles 
    const errorKeys = Object.keys(errors);

    for (const key of errorKeys) {
      switch (key) {
        case 'required':
          return 'Este campo es obligatorio.';
        case 'email':
          return 'El formato del correo no es válido.';
        case 'minlength':
          return `Mínimo ${errors['minlength'].requiredLength} caracteres.`;
        case 'min':
          return `El valor mínimo es ${errors['min'].min}.`;
        default:
          return 'El campo contiene errores.';
      }
    }

    return null;
  }
}