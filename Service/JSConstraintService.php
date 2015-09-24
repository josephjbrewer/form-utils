<?php

namespace JJB\FormUtilsBundle\Service;

use Symfony\Bundle\FrameworkBundle\Translation\Translator;
use Symfony\Component\Validator\Constraint;
use Symfony\Component\Validator\Constraints;

class JSConstraintService
{
    /**
     * Types of constraints that we currently support
     */
    const CONSTRAINT_TYPE_LENGTH   = 'Length';
    const CONSTRAINT_TYPE_REGEX    = 'Regex';
    const CONSTRAINT_TYPE_NOTBLANK = 'NotBlank';
    const CONSTRAINT_TYPE_EMAIL    = 'Email';
    const CONSTRAINT_TYPE_LUHN     = 'Luhn';

    /**
     * @var Translator
     */
    private $translator;


    public function __construct(Translator $translator)
    {
        $this->translator = $translator;
    }

    /**
     * @param Constraint $constraint
     * @param null|string $domain
     * @param null|array $tests
     * @param null|array $messages
     * @return array
     */
    public function extractConstraints(Constraint $constraint, $domain = null, $tests = [], $messages = [])
    {
        $namespace = get_class($constraint);
        $parts     = explode('\\', $namespace);
        $class     = array_pop($parts);

        switch ($class) {

            /*
             * TODO: Add support for the following constraints
             *
             * - Blank
             * - CardScheme
             * - Count
             * - Date
             * - DateTime
             * - EqualTo
             * - GreaterThan
             * - LessThan
             * - GreaterThanOrEqualTo
             * - LessThanOrEqualTo
             * - Iban
             * - Ip
             * - Isbn
             * - NotEqualTo
             * - Range
             * - Time
             * - Url
             */

            case self::CONSTRAINT_TYPE_NOTBLANK:
                /**
                 * @var Constraints\NotBlank $constraint
                 */
                $tests[]    = "__NOT_BLANK__";
                $messages[] = $this->trans($constraint->message, [], $domain);
                break;

            case self::CONSTRAINT_TYPE_LENGTH:
                /** @var Constraints\Length $constraint */
                if ($constraint->min > 0 && $constraint->max > 0 && ($constraint->min === $constraint->max)) {
                    $tests[]    = '^.{' . $constraint->min . ',' . $constraint->max . '}$';
                    $messages[] = str_replace(
                        '{{ ' . $constraint->min . ' }}',
                        $constraint->min,
                        $this->trans($constraint->exactMessage, [
                            'limit' => $constraint->min
                        ], $domain, $constraint->min)
                    );
                } else {
                    if ($constraint->min > 0) {
                        $tests[]    = '.{' . $constraint->min . ',}';
                        $messages[] = str_replace(
                            '{{ ' . $constraint->min . ' }}',
                            $constraint->min,
                            $this->trans($constraint->minMessage, [
                                'limit' => $constraint->min
                            ], $domain, $constraint->min)
                        );
                    }

                    if ($constraint->max > 0) {
                        $tests[]    = '^.{0,' . $constraint->max . '}$';
                        $messages[] = str_replace(
                            '{{ ' . $constraint->max . ' }}',
                            $constraint->max,
                            $this->trans($constraint->maxMessage, [
                                'limit' => $constraint->max
                            ], $domain, $constraint->max)
                        );
                    }
                }

                break;

            case self::CONSTRAINT_TYPE_REGEX:
                /** @var Constraints\Regex $constraint */
                $tests[]    = str_replace('/', '', $constraint->pattern);
                $messages[] = $this->trans($constraint->message, [], $domain);
                break;

            case self::CONSTRAINT_TYPE_LUHN:
                /** @var Constraints\Luhn $constraint */
                $tests[]    = '__LUHN__';
                $messages[] = $this->trans($constraint->message, [], $domain);
                break;

            case self::CONSTRAINT_TYPE_EMAIL:
                /** @var Constraints\Email $constraint */
                $tests[]    = "^.+\@\S+\.\S+$";
                $messages[] = $this->trans($constraint->message, [], $domain);
                break;

            default:
                break;
        }

        return [$tests, $messages];
    }

    /**
     * @param string $string
     * @param string array $params
     * @param string $domain
     * @param int $number
     * @return string
     */
    private function trans($string, array $params = [], $domain, $number = 1)
    {
        return $this->translator->transChoice($string, $number, $params, $domain);
    }
}