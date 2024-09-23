import { registerDecorator, ValidationOptions, ValidationArguments } from 'class-validator';

export function IsOneOfNotEmpty(properties: string[], validationOptions?: ValidationOptions) {
    return function (object: object, propertyName: string) {
        registerDecorator({
            name: 'isOneOfNotEmpty',
            target: object.constructor,
            propertyName: propertyName,
            options: validationOptions,
            validator: {
                validate(value: never, args: ValidationArguments) {
                    const relatedProperties = args.constraints[0];
                    return relatedProperties.some((property: string) => {
                        const relatedValue = (args.object as never)[property];
                        return relatedValue !== undefined && relatedValue !== '';
                    });
                },
                defaultMessage(args: ValidationArguments) {
                    const relatedProperties = args.constraints[0];
                    return `At least one of ${relatedProperties.join(', ')} must not be empty`;
                },
            },
            constraints: [properties],
        });
    };
}
